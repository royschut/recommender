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
    const selectedGenres = searchParams.get('genres')?.split(',').filter(Boolean) || []

    console.log('🔍 Concept weights from request:', conceptWeights)
    console.log('🔍 Filters from request:', {
      yearMin,
      yearMax,
      scoreMin,
      scoreMax,
      selectedGenres,
    })

    const limit = parseInt(searchParams.get('limit') || '12')

    console.log('🎛️ Explore GET request:', {
      conceptWeights,
      yearMin,
      yearMax,
      scoreMin,
      scoreMax,
      selectedGenres,
      limit,
    })

    const collectionName = 'movie-embeddings'

    // Check if any concept weights are active (non-zero)
    const hasActiveWeights = Object.values(conceptWeights).some((weight) => weight !== 0)

    if (!hasActiveWeights) {
      // No concept weights active - return filtered random popular films
      console.log(
        '🎲 No active concept weights, applying filters and returning random popular films...',
      )

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

      // Add genre filter if specified
      if (selectedGenres.length > 0) {
        whereConditions['genres.genre'] = {
          in: selectedGenres,
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
          filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
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
          filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
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

      const movieIds = qdrantResults.map((point: any) => point.payload?.movieId).filter(Boolean)

      if (movieIds.length === 0) {
        return NextResponse.json({
          success: true,
          results: [],
          totalFound: 0,
          method: 'filtered_random',
          conceptWeights,
          filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
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
        filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
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

      // Add genre filter if specified
      if (selectedGenres.length > 0) {
        whereConditions['genres.genre'] = {
          in: selectedGenres,
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
          filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
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
        filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
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
      filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      conceptWeights = {},
      yearMin = 0,
      yearMax = 0,
      scoreMin = 0,
      scoreMax = 0,
      selectedGenres = [],
      limit = 12,
      page = 1,
      offset = 0,
    } = body

    console.log('🎛️ Explore POST request:', {
      conceptWeights,
      yearMin,
      yearMax,
      scoreMin,
      scoreMax,
      selectedGenres,
      limit,
      page,
      offset,
    })

    const collectionName = 'movie-embeddings'

    // Check if any concept weights are active (non-zero)
    const hasActiveWeights = Object.values(conceptWeights).some((weight: any) => weight !== 0)

    if (!hasActiveWeights) {
      // No concept weights active - return paginated filtered random popular films
      console.log('🎲 No active concept weights, returning paginated random popular films...')

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

      // Add genre filter if specified
      if (selectedGenres.length > 0) {
        whereConditions['genres.genre'] = {
          in: selectedGenres,
        }
      }

      // Get total count first
      const totalCount = await payload.count({
        collection: 'movies',
        where: whereConditions,
      })

      // Calculate pagination
      const currentOffset = offset || (page - 1) * limit

      // Get paginated results
      const filteredMovies = await payload.find({
        collection: 'movies',
        where: whereConditions,
        limit,
        page: page || undefined,
        sort: '-voteAverage', // Sort by rating for consistent pagination
      })

      console.log(
        `✅ Found ${filteredMovies.docs.length} films (page ${page}, total: ${totalCount.totalDocs})`,
      )

      return NextResponse.json({
        success: true,
        results: filteredMovies.docs,
        totalFound: totalCount.totalDocs,
        totalPages: Math.ceil(totalCount.totalDocs / limit),
        currentPage: page,
        hasNextPage: page * limit < totalCount.totalDocs,
        hasPrevPage: page > 1,
        method: 'paginated_random',
        conceptWeights,
        filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
      })
    }

    // Load concept vectors from Qdrant
    const conceptVectors = await loadConceptVectors()

    if (Object.keys(conceptVectors).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Concept vectors not available',
        },
        { status: 500 },
      )
    }

    // Create target vector based on concept weights
    const targetVector = createTargetVectorFromConcepts(conceptWeights, conceptVectors)

    if (!targetVector) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not create target vector from concept weights',
        },
        { status: 400 },
      )
    }

    // Pre-filter movies using Payload if filters are applied
    let preFilteredMovieIds: string[] | null = null

    if (yearMin > 0 || yearMax > 0 || scoreMin > 0 || scoreMax > 0 || selectedGenres.length > 0) {
      console.log('🔍 Pre-filtering movies based on criteria...')

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

      // Add genre filter if specified
      if (selectedGenres.length > 0) {
        whereConditions['genres.genre'] = {
          in: selectedGenres,
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
          totalPages: 0,
          currentPage: page,
          hasNextPage: false,
          hasPrevPage: false,
          method: 'concept_based_search_filtered',
          conceptWeights,
          filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
        })
      }

      console.log(`🔍 Pre-filter reduced search space to ${preFilteredMovieIds.length} movies`)
    }

    // Use regular search with the target vector, get more results for pagination
    const searchLimit = Math.min(limit * 10, 100) // Get more results to enable pagination
    const currentOffset = offset || (page - 1) * limit

    const searchResults = await qdrant.search(collectionName, {
      vector: targetVector,
      limit: searchLimit,
      offset: currentOffset,
      with_payload: true,
      filter: preFilteredMovieIds
        ? {
            must: [
              {
                key: 'movieId',
                match: {
                  any: preFilteredMovieIds,
                },
              },
            ],
          }
        : undefined,
    })

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        totalFound: 0,
        totalPages: 0,
        currentPage: page,
        hasNextPage: false,
        hasPrevPage: false,
        method: 'concept_based_search',
        conceptWeights,
        filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
      })
    }

    // Get movie IDs from search results
    const movieIds = searchResults.map((result: any) => result.payload?.movieId).filter(Boolean)

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

    // Sort movies by their similarity score and paginate
    const sortedMovies = movieIds
      .map((movieId: string) => {
        const movie = movies.docs.find((m) => String(m.id) === movieId)
        const searchResult = searchResults.find((r) => r.payload?.movieId === movieId)
        return {
          ...movie,
          similarityScore: searchResult?.score || 0,
        }
      })
      .filter(Boolean)
      .slice(0, limit) // Apply limit for this page

    // Estimate total results (this is approximate for concept-based search)
    const estimatedTotal = Math.min(searchResults.length * 2, 1000)
    const totalPages = Math.ceil(estimatedTotal / limit)

    console.log(`✅ Found ${sortedMovies.length} films using concept-based search (page ${page})`)

    return NextResponse.json({
      success: true,
      results: sortedMovies,
      totalFound: estimatedTotal,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      method: 'concept_based_search',
      conceptWeights,
      filters: { yearMin, yearMax, scoreMin, scoreMax, selectedGenres },
      appliedConcepts: Object.entries(conceptWeights)
        .filter(([_, weight]) => weight !== 0)
        .map(([concept, weight]) => ({ concept, weight })),
    })
  } catch (error: any) {
    console.error('❌ Explore POST API error:', error)
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
