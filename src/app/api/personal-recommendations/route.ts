import { NextRequest, NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST() {
  try {
    // Initialize Payload and Qdrant
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    })

    const collectionName = 'movie-embeddings'

    // Get all favorites with movie details
    const favorites = await payload.find({
      collection: 'favorites',
      depth: 1, // This will populate the relationship fields
      limit: 100, // Limit to avoid too large requests
    })

    if (favorites.docs.length === 0) {
      return NextResponse.json(
        { error: 'No favorites found. Add some movies to your favorites first!' },
        { status: 400 },
      )
    }

    // Extract movie data from favorites
    const favoriteMovies = favorites.docs.map((fav: any) => fav.movie).filter(Boolean)

    // Get Qdrant IDs from favorite movies that have embeddings
    const favoriteQdrantIds = favoriteMovies
      .filter((movie: any) => movie.qdrantId && movie.hasEmbedding)
      .map((movie: any) => parseInt(movie.qdrantId))

    if (favoriteQdrantIds.length === 0) {
      return NextResponse.json(
        {
          error:
            'No favorite movies with embeddings found. Please add movies to your favorites or wait for embeddings to be generated.',
          favoriteCount: favoriteMovies.length,
          embeddedCount: 0,
        },
        { status: 400 },
      )
    }

    // Use Qdrant recommend API with favorite movie vectors as positive examples
    const recommendResults = await qdrant.recommend(collectionName, {
      positive: favoriteQdrantIds,
      limit: 10,
      with_payload: true,
      with_vector: true, // Include vectors to potentially save user profile later
    })

    // Get movie IDs from recommend results
    const recommendedMovieIds = recommendResults
      .map((result: any) => result.payload?.movieId)
      .filter(Boolean)

    if (recommendedMovieIds.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        favoriteCount: favoriteMovies.length,
        embeddedCount: favoriteQdrantIds.length,
        message: 'No personalized recommendations found based on your favorites',
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
      .map((movieId: any) => {
        const recMovie = recommendations.docs.find((m: any) => String(m.id) === movieId)
        const recommendResult = recommendResults.find((r: any) => r.payload?.movieId === movieId)
        return {
          ...recMovie,
          similarityScore: recommendResult?.score || 0,
        }
      })
      .filter(Boolean)

    // Calculate user preference vector (average of favorite movie vectors)
    const userProfileVector =
      recommendResults.length > 0 && recommendResults[0].vector
        ? recommendResults
            .map((r: any) => r.vector || [])
            .reduce((acc: number[], vec: number[]) => {
              if (vec.length === 0) return acc
              return acc.length === 0
                ? [...vec]
                : acc.map((val: number, i: number) => val + (vec[i] || 0))
            }, [])
            .map((val: number) => val / recommendResults.length)
        : null

    return NextResponse.json({
      success: true,
      recommendations: sortedRecommendations,
      favoriteCount: favoriteMovies.length,
      embeddedCount: favoriteQdrantIds.length,
      totalRecommendations: sortedRecommendations.length,
      userProfileVector: userProfileVector, // Can be saved for future use
      message: `Personalized recommendations based on ${favoriteQdrantIds.length} of your ${favoriteMovies.length} favorite movies`,
    })
  } catch (error: any) {
    console.error('Personal recommendations error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get personalized recommendations',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
