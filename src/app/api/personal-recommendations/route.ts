import { NextRequest, NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
})

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

    // Create a combined text from all favorite movies for embedding
    const favoriteTexts = favoriteMovies.map((movie: any) => {
      const genres = movie.genres?.map((g: any) => g.genre).join(', ') || ''
      return `${movie.title} (${movie.originalTitle || movie.title}) - ${genres} - ${movie.overview || ''}`
    })

    // Combine all favorite movie descriptions
    const combinedText = favoriteTexts.join(' | ')

    // Create embedding for the combined preferences
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: combinedText,
      encoding_format: 'float',
    })

    const preferenceVector = embeddingResponse.data[0].embedding

    // Get movie IDs of favorites to exclude them from recommendations
    const favoriteMovieIds = favoriteMovies.map((movie: any) => String(movie.id))

    // Search for similar movies based on preferences
    const searchResults = await qdrant.search(collectionName, {
      vector: preferenceVector,
      limit: 20, // Get more results to filter out favorites
      with_payload: true,
      filter: {
        must_not: favoriteMovieIds.map((movieId) => ({
          key: 'movieId',
          match: {
            value: movieId,
          },
        })),
      },
    })

    // Get movie IDs from search results
    const recommendedMovieIds = searchResults
      .map((result) => result.payload?.movieId)
      .filter(Boolean)
      .slice(0, 10) // Take top 10 recommendations

    if (recommendedMovieIds.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        favoriteCount: favoriteMovies.length,
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
      recommendations: sortedRecommendations,
      favoriteCount: favoriteMovies.length,
      totalRecommendations: sortedRecommendations.length,
      message: `Personalized recommendations based on your ${favoriteMovies.length} favorite movies`,
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
