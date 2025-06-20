import { NextRequest, NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

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

    const limit = parseInt(searchParams.get('limit') || '12')

    console.log('🎛️ Explore GET request:', { conceptWeights, limit })

    const collectionName = 'movie-embeddings'

    // Check if any concept weights are active (non-zero)
    const hasActiveWeights = Object.values(conceptWeights).some((weight) => weight !== 0)

    if (!hasActiveWeights) {
      // No concept weights active - return random popular films
      console.log('🎲 No active concept weights, returning random popular films...')

      const randomResults = await qdrant.scroll(collectionName, {
        limit: limit * 2, // Get more to have variety
        with_payload: true,
        with_vector: false,
      })

      // Get movie IDs from Qdrant results and shuffle them
      const movieIds = randomResults.points
        .map((point: any) => point.payload?.movieId)
        .filter(Boolean)
        .sort(() => Math.random() - 0.5) // Shuffle randomly
        .slice(0, limit)

      if (movieIds.length === 0) {
        return NextResponse.json({
          success: true,
          results: [],
          totalFound: 0,
          method: 'random_popular',
          conceptWeights,
        })
      }

      // Fetch full movie details from Payload (just like search API does)
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })

      const movies = await payload.find({
        collection: 'movies',
        where: {
          id: {
            in: movieIds,
          },
        },
        limit: movieIds.length,
      })

      return NextResponse.json({
        success: true,
        results: movies.docs,
        totalFound: movies.docs.length,
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

    // Get movie IDs from search results
    const movieIds = searchResults.map((result) => result.payload?.movieId).filter(Boolean)

    if (movieIds.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        totalFound: 0,
        method: 'concept_based_search',
        conceptWeights,
      })
    }

    // Fetch full movie details from Payload (just like search API does)
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const movies = await payload.find({
      collection: 'movies',
      where: {
        id: {
          in: movieIds,
        },
      },
      limit: movieIds.length,
    })

    // Sort movies by their similarity score (maintaining order from Qdrant)
    const sortedMovies = movieIds
      .map((movieId) => {
        const movie = movies.docs.find((m) => String(m.id) === movieId)
        const searchResult = searchResults.find((r) => r.payload?.movieId === movieId)
        return {
          ...movie,
          similarityScore: searchResult?.score || 0,
        }
      })
      .filter(Boolean)

    console.log(`✅ Found ${sortedMovies.length} films using concept-based search`)

    return NextResponse.json({
      success: true,
      results: sortedMovies,
      totalFound: sortedMovies.length,
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
