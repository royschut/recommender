import { NextRequest, NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
})

// Concept vectors cache
const conceptVectorCache: Record<string, number[]> = {}

// Function to load concept vectors from Qdrant
async function loadConceptVectors(): Promise<Record<string, number[]>> {
  if (Object.keys(conceptVectorCache).length > 0) {
    return conceptVectorCache
  }

  const conceptCollectionName = 'concept-vectors'
  const conceptNames = ['adventure', 'romance', 'complexity', 'emotion', 'realism']

  try {
    const searchResults = await qdrant.scroll(conceptCollectionName, {
      with_vector: true,
      with_payload: true,
      limit: 10,
    })

    const vectors: Record<string, number[]> = {}

    if (searchResults.points) {
      searchResults.points.forEach((point) => {
        if (point.payload && point.payload.concept && point.vector) {
          const conceptName = point.payload.concept as string
          if (conceptNames.includes(conceptName)) {
            vectors[conceptName] = point.vector as number[]
            conceptVectorCache[conceptName] = point.vector as number[]
          }
        }
      })
    }

    console.log(`✅ Loaded ${Object.keys(vectors).length} concept vectors for exploration`)
    return vectors
  } catch (error: any) {
    console.log('⚠️  Could not load concept vectors from Qdrant:', error.message)
    return {}
  }
}

// Function to create a target vector from concept weights
function createTargetVectorFromConcepts(
  conceptWeights: Record<string, number>,
  conceptVectors: Record<string, number[]>,
): number[] | null {
  const activeWeights = Object.entries(conceptWeights).filter(([_, weight]) => weight !== 0)

  if (activeWeights.length === 0) {
    return null
  }

  // Get vector dimension from any concept vector
  const sampleVector = Object.values(conceptVectors)[0]
  if (!sampleVector) {
    return null
  }

  const result = new Array(sampleVector.length).fill(0)

  // Combine concept vectors based on weights
  for (const [concept, weight] of activeWeights) {
    if (conceptVectors[concept]) {
      const conceptVector = conceptVectors[concept]
      const scaledWeight = weight * 0.3 // Scale factor to prevent overwhelming

      for (let i = 0; i < result.length; i++) {
        result[i] += (conceptVector[i] || 0) * scaledWeight
      }
    }
  }

  console.log(`🎯 Created target vector from ${activeWeights.length} concept weights`)
  return result
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse concept weights from URL parameters
    const conceptWeights: Record<string, number> = {
      adventure: parseFloat(searchParams.get('adventure') || '0'),
      romance: parseFloat(searchParams.get('romance') || '0'),
      complexity: parseFloat(searchParams.get('complexity') || '0'),
      emotion: parseFloat(searchParams.get('emotion') || '0'),
      realism: parseFloat(searchParams.get('realism') || '0'),
    }

    console.log('🔍 Concept weights from request:', conceptWeights)

    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('🎛️ Explore GET request:', { conceptWeights, limit })

    const collectionName = 'movie-embeddings'

    // Check if any concept weights are active (non-zero)
    const hasActiveWeights = Object.values(conceptWeights).some((weight) => weight !== 0)

    if (!hasActiveWeights) {
      // No concept weights active - return random popular film

      console.log('🎲 No active concept weights, returning random popular films...')
      console.log('TEST')

      const randomResults = await qdrant.scroll(collectionName, {
        limit: 10, //limit * 3, // Get more to filter out low-rated ones
        // with_payload: true,
        // with_vector: false,
      })

      // Filter for movies with decent ratings and shuffle
      const decentMovies = randomResults.points
        .filter((point: any) => {
          const rating = point.payload?.vote_average
          return rating && rating >= 6.0 // Only show movies with rating >= 6.0
        })
        .sort(() => Math.random() - 0.5) // Shuffle randomly
        .slice(0, limit)

      const movies = decentMovies.map((point: any) => ({
        id: point.id.toString(),
        title: point.payload?.title || 'Unknown Title',
        overview: point.payload?.overview || '',
        poster_path: point.payload?.poster_path || null,
        backdrop_path: point.payload?.backdrop_path || null,
        release_date: point.payload?.release_date || '',
        vote_average: point.payload?.vote_average || 0,
        vote_count: point.payload?.vote_count || 0,
        genre_ids: point.payload?.genre_ids || [],
        popularity: point.payload?.popularity || 0,
      }))

      return NextResponse.json({
        success: true,
        results: movies,
        totalFound: movies.length,
        method: 'random_popular',
        conceptWeights,
      })
    }

    // Active concept weights - use concept-based search
    console.log('🎛️ Active concept weights detected, loading concept vectors...')

    // Load concept vectors
    const conceptVectors = await loadConceptVectors()

    if (Object.keys(conceptVectors).length === 0) {
      throw new Error('Concept vectors not available')
    }

    // Create a combined target vector from concept weights
    const targetVector = createTargetVectorFromConcepts(conceptWeights, conceptVectors)

    if (!targetVector) {
      throw new Error('Could not create target vector from concepts')
    }

    console.log('🎯 Searching with concept-based target vector...')

    // Use regular search with the target vector
    const searchResults = await qdrant.search(collectionName, {
      vector: targetVector,
      limit,
      with_payload: true,
      with_vector: false,
    })

    const movies = searchResults.map((result: any) => ({
      id: result.id.toString(),
      title: result.payload?.title || 'Unknown Title',
      overview: result.payload?.overview || '',
      poster_path: result.payload?.poster_path || null,
      backdrop_path: result.payload?.backdrop_path || null,
      release_date: result.payload?.release_date || '',
      vote_average: result.payload?.vote_average || 0,
      vote_count: result.payload?.vote_count || 0,
      genre_ids: result.payload?.genre_ids || [],
      popularity: result.payload?.popularity || 0,
      score: result.score,
    }))

    console.log(`✅ Found ${movies.length} films using concept-based search`)

    return NextResponse.json({
      success: true,
      results: movies,
      totalFound: movies.length,
      method: 'concept_based_search',
      conceptWeights,
      appliedConcepts: Object.entries(conceptWeights)
        .filter(([_, weight]) => weight !== 0)
        .map(([concept, weight]) => ({ concept, weight })),
    })
  } catch (error: any) {
    console.error('❌ Explore GET API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Er is een fout opgetreden bij het exploreren',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
