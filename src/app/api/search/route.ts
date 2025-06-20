import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Concept vectors will be loaded dynamically from Qdrant
const conceptVectorCache: Record<string, number[]> = {}

// Function to load concept vectors from Qdrant
async function loadConceptVectors(qdrant: QdrantClient): Promise<Record<string, number[]>> {
  const conceptCollectionName = 'concept-vectors'
  const conceptNames = ['adventure', 'romance', 'complexity', 'emotion', 'realism']

  try {
    // Since we now use numeric IDs, we need to search by concept name in payload
    const searchResults = await qdrant.scroll(conceptCollectionName, {
      with_vector: true,
      with_payload: true,
      limit: 10, // Small collection, we can get all points
    })

    const vectors: Record<string, number[]> = {}

    if (searchResults.points) {
      searchResults.points.forEach((point) => {
        if (point.payload && point.payload.concept && point.vector) {
          const conceptName = point.payload.concept as string
          if (conceptNames.includes(conceptName)) {
            vectors[conceptName] = point.vector as number[]
          }
        }
      })
    }

    console.log(`✅ Loaded ${Object.keys(vectors).length} concept vectors from Qdrant`)
    console.log(`Available concepts: ${Object.keys(vectors).join(', ')}`)
    return vectors
  } catch (error: any) {
    console.log('⚠️  Could not load concept vectors from Qdrant:', error.message)
    return {}
  }
}

function combineVectors(
  queryVector: number[],
  conceptWeights: Record<string, number>,
  conceptVectors: Record<string, number[]>,
): number[] {
  const result = [...queryVector]

  // Only apply concept vectors if they exist and have content
  const hasValidConcepts = Object.values(conceptVectors).some((v) => v.length > 0)

  if (!hasValidConcepts) {
    console.log('⚠️  Concept vectors not available, using query vector only')
    return result
  }

  let appliedWeights = 0
  for (const [concept, weight] of Object.entries(conceptWeights)) {
    if (weight !== 0 && conceptVectors[concept] && conceptVectors[concept].length > 0) {
      const conceptVector = conceptVectors[concept]

      // Add or subtract concept vector based on weight
      for (let i = 0; i < result.length; i++) {
        result[i] += (conceptVector[i] || 0) * weight * 0.3 // Scale factor to prevent overwhelming the main query
      }
      appliedWeights++
    }
  }

  if (appliedWeights > 0) {
    console.log(`✨ Applied ${appliedWeights} concept weights to search vector`)
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const { query, conceptWeights = {} } = await request.json()

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a non-empty string' },
        { status: 400 },
      )
    }

    // Initialize OpenAI and Qdrant clients
    const openai = new OpenAI({
      apiKey: process.env.OPEN_AI_API_KEY,
    })

    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    })

    const collectionName = 'movie-embeddings'

    // Load concept vectors from Qdrant (with caching)
    if (Object.keys(conceptVectorCache).length === 0) {
      const loadedVectors = await loadConceptVectors(qdrant)
      Object.assign(conceptVectorCache, loadedVectors)
    }

    // Create embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.trim(),
      encoding_format: 'float',
    })

    const queryVector = embeddingResponse.data[0].embedding

    // Combine query vector with concept vectors based on the provided weights
    const combinedVector = combineVectors(queryVector, conceptWeights, conceptVectorCache)

    console.log('Applied concept weights:', conceptWeights)

    // Search for similar vectors in Qdrant
    const searchResults = await qdrant.search(collectionName, {
      vector: combinedVector,
      limit: 10,
      with_payload: true,
    })

    // Get movie IDs from search results
    const movieIds = searchResults.map((result) => result.payload?.movieId).filter(Boolean)

    if (movieIds.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No movies found matching your search query',
        conceptWeights,
        conceptsEnabled: Object.keys(conceptVectorCache).length > 0,
      })
    }

    // Fetch full movie details from Payload
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

    return NextResponse.json({
      success: true,
      query,
      results: sortedMovies,
      totalFound: sortedMovies.length,
      conceptWeights, // Show which concept weights were applied
      conceptsEnabled: Object.keys(conceptVectorCache).length > 0,
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform search',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
