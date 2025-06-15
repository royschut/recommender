import { NextRequest, NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const { movieId } = await request.json()

    if (!movieId || typeof movieId !== 'string') {
      return NextResponse.json(
        { error: 'Movie ID is required and must be a string' },
        { status: 400 },
      )
    }

    // Initialize Payload and Qdrant
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    })

    const collectionName = 'movie-embeddings'

    // Get the movie details
    const movie = await payload.findByID({
      collection: 'movies',
      id: movieId,
    })

    if (!movie || !movie.qdrantId) {
      return NextResponse.json(
        { error: 'Movie not found or no embedding available' },
        { status: 404 },
      )
    }

    // Get the movie's vector from Qdrant
    const moviePoint = await qdrant.retrieve(collectionName, {
      ids: [parseInt(movie.qdrantId)],
      with_vector: true,
    })

    if (!moviePoint || moviePoint.length === 0) {
      return NextResponse.json(
        { error: 'Movie vector not found in Qdrant' },
        { status: 404 },
      )
    }

    const movieVector = moviePoint[0].vector as number[]

    // Search for similar movies (excluding the original movie)
    const searchResults = await qdrant.search(collectionName, {
      vector: movieVector,
      limit: 11, // Get 11 to exclude the original movie
      with_payload: true,
      filter: {
        must_not: [
          {
            key: 'movieId',
            match: {
              value: movieId,
            },
          },
        ],
      },
    })

    // Get movie IDs from search results (excluding the original)
    const recommendedMovieIds = searchResults
      .map((result) => result.payload?.movieId)
      .filter((id) => id && id !== movieId)
      .slice(0, 10) // Take top 10 recommendations

    if (recommendedMovieIds.length === 0) {
      return NextResponse.json({
        success: true,
        movie,
        recommendations: [],
        message: 'No similar movies found',
      })
    }

    // Fetch full movie details for recommendations
    const recommendations = await payload.find({
      collection: 'movies',
      where: {
        id: {
          in: recommendedMovieIds,
        },
      },
      limit: recommendedMovieIds.length,
    })

    // Sort recommendations by similarity score
    const sortedRecommendations = recommendedMovieIds
      .map((movieId) => {
        const recMovie = recommendations.docs.find((m) => String(m.id) === movieId)
        const searchResult = searchResults.find((r) => r.payload?.movieId === movieId)
        return {
          ...recMovie,
          similarityScore: searchResult?.score || 0,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      movie,
      recommendations: sortedRecommendations,
      totalRecommendations: sortedRecommendations.length,
    })
  } catch (error: any) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get recommendations',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
