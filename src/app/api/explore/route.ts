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

    // Parse filter parameters
    const yearMin = parseInt(searchParams.get('yearMin') || '0')
    const yearMax = parseInt(searchParams.get('yearMax') || '0')
    const scoreMin = parseFloat(searchParams.get('scoreMin') || '0')
    const scoreMax = parseFloat(searchParams.get('scoreMax') || '0')

    console.log('🔍 Concept weights from request:', conceptWeights)
    console.log('🔍 Filters from request:', { yearMin, yearMax, scoreMin, scoreMax })

    const limit = parseInt(searchParams.get('limit') || '12')

    console.log('🎛️ Explore GET request:', {
      conceptWeights,
      yearMin,
      yearMax,
      scoreMin,
      scoreMax,
      limit,
    })

    const collectionName = 'movie-embeddings'

    // Check if any concept weights are active (non-zero)
    const hasActiveWeights = Object.values(conceptWeights).some((weight) => weight !== 0)

    if (!hasActiveWeights) {
      // No concept weights active - return filtered random popular films
      console.log('🎲 No active concept weights, applying filters and returning random popular films...')

      // First, get filtered movie IDs from Payload based on filters
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })

      // Build Payload filters for pre-filtering
      const whereConditions: any = {
        hasEmbedding: {
          equals: true, // Only get movies that have embeddings in Qdrant
        },
      }

      // Add year filter if specified
      if (yearMin > 0 || yearMax > 0) {
        whereConditions.releaseDate = {}
        if (yearMin > 0) {
          whereConditions.releaseDate.greater_than_equal = `${yearMin}-01-01`
        }
        if (yearMax > 0) {
          whereConditions.releaseDate.less_than_equal = `${yearMax}-12-31`
        }
      }

      // Add score filter if specified
      if (scoreMin > 0 || scoreMax > 0) {
        whereConditions.voteAverage = {}
        if (scoreMin > 0) {
          whereConditions.voteAverage.greater_than_equal = scoreMin
        }
        if (scoreMax > 0) {
          whereConditions.voteAverage.less_than_equal = scoreMax
        }
      }

      // Get filtered movies from Payload
      const filteredMovies = await payload.find({
        collection: 'movies',
        where: whereConditions,
        limit: 0, // Get all matching movies
        select: {
          id: true,
          qdrantId: true,
        },
      })

      if (filteredMovies.docs.length === 0) {
        return NextResponse.json({
          success: true,
          results: [],
          totalFound: 0,
          method: 'filtered_random',
          conceptWeights,
          filters: { yearMin, yearMax, scoreMin, scoreMax },
        })
      }

      // Get Qdrant IDs from filtered movies
      const qdrantIds = filteredMovies.docs
        .filter((movie: any) => movie.qdrantId)
        .map((movie: any) => parseInt(movie.qdrantId))

      if (qdrantIds.length === 0) {
        return NextResponse.json({
          success: true,
          results: [],
          totalFound: 0,
          method: 'filtered_random',
          conceptWeights,
          filters: { yearMin, yearMax, scoreMin, scoreMax },
        })
      }

      // Randomly shuffle and limit the Qdrant IDs
      const shuffledIds = qdrantIds
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(limit, qdrantIds.length))

      // Get the full details from Qdrant to get movieIds  
      const qdrantResults = await qdrant.retrieve(collectionName, {
        ids: shuffledIds,
        with_payload: true,
      })

      const movieIds = qdrantResults
        .map((point: any) => point.payload?.movieId)
        .filter(Boolean)

      if (movieIds.length === 0) {
        return NextResponse.json({
          success: true,
          results: [],
          totalFound: 0,
          method: 'filtered_random',
          conceptWeights,
          filters: { yearMin, yearMax, scoreMin, scoreMax },
        })
      }

      // Fetch full movie details from Payload
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
        totalAvailable: filteredMovies.docs.length,
        method: 'filtered_random',
        conceptWeights,
        filters: { yearMin, yearMax, scoreMin, scoreMax },
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

    // Build pre-filter conditions for Payload if filters are specified
    let preFilteredMovieIds: string[] | null = null
    
    if (yearMin > 0 || yearMax > 0 || scoreMin > 0 || scoreMax > 0) {
      console.log('🔍 Pre-filtering movies based on year/score filters...')
      
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })
      
      const whereConditions: any = {
        hasEmbedding: {
          equals: true,
        },
      }

      // Add year filter if specified
      if (yearMin > 0 || yearMax > 0) {
        whereConditions.releaseDate = {}
        if (yearMin > 0) {
          whereConditions.releaseDate.greater_than_equal = `${yearMin}-01-01`
        }
        if (yearMax > 0) {
          whereConditions.releaseDate.less_than_equal = `${yearMax}-12-31`
        }
      }

      // Add score filter if specified
      if (scoreMin > 0 || scoreMax > 0) {
        whereConditions.voteAverage = {}
        if (scoreMin > 0) {
          whereConditions.voteAverage.greater_than_equal = scoreMin
        }
        if (scoreMax > 0) {
          whereConditions.voteAverage.less_than_equal = scoreMax
        }
      }

      const filteredMovies = await payload.find({
        collection: 'movies',
        where: whereConditions,
        limit: 0,
      })

      preFilteredMovieIds = filteredMovies.docs.map((movie: any) => String(movie.id))
      
      if (preFilteredMovieIds.length === 0) {
        return NextResponse.json({
          success: true,
          results: [],
          totalFound: 0,
          method: 'concept_based_search_filtered',
          conceptWeights,
          filters: { yearMin, yearMax, scoreMin, scoreMax },
        })
      }
      
      console.log(`🔍 Pre-filter reduced search space to ${preFilteredMovieIds.length} movies`)
    }

    // Use regular search with the target vector, but get more results if we're filtering
    const searchLimit = preFilteredMovieIds ? Math.min(limit * 3, 50) : limit
    
    const searchResults = await qdrant.search(collectionName, {
      vector: targetVector,
      limit: searchLimit,
      with_payload: true,
      with_vector: false,
    })

    // Get movie IDs from search results
    let movieIds = searchResults.map((result) => result.payload?.movieId).filter(Boolean)
    
    // Apply pre-filter if we have one
    if (preFilteredMovieIds) {
      movieIds = movieIds.filter((movieId) => preFilteredMovieIds!.includes(String(movieId)))
      console.log(`🔍 Post-filter reduced results to ${movieIds.length} movies`)
    }
    
    // Limit to final desired count
    movieIds = movieIds.slice(0, limit)

    if (movieIds.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        totalFound: 0,
        method: 'concept_based_search',
        conceptWeights,
        filters: { yearMin, yearMax, scoreMin, scoreMax },
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
      filters: { yearMin, yearMax, scoreMin, scoreMax },
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
