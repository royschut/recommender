import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  getRandomMovies,
  getBatchMovieRecommendations,
  getRecommendationsForUserProfile,
} from './utils'
import { NextResponse } from 'next/server'

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env.QDRANT_API_KEY })

export async function POST(req: Request) {
  try {
    const { excluded = [], userProfile = [] } = await req.json()

    // 1. Get movies based on userProfile or random if no profile
    const moviesResponse =
      userProfile.length > 0
        ? await getRecommendationsForUserProfile(qdrant, userProfile, excluded)
        : await getRandomMovies(qdrant, excluded)

    const movies = 'points' in moviesResponse ? moviesResponse.points : moviesResponse

    if (!movies.length) return NextResponse.json({ success: true, results: [], totalFound: 0 })

    const payload = await getPayload({ config: await config })
    const movieIds = movies.map((m: any) => m.payload?.movieId as string).filter(Boolean)
    const { docs: movieDocs } = await payload.find({
      collection: 'movies',
      where: { id: { in: movieIds } },
      limit: movieIds.length,
    })

    // Use existing neutral mood vector for first dislike recommendations
    const neutralVectorId = 1758054612634 // Existing empty mood vector (as number)

    // 2. Generate like/dislike recommendations for each movie using batch
    const movieRecommendations = await getBatchMovieRecommendations(qdrant, movies, neutralVectorId)

    // Get all recommendation movie IDs and fetch docs
    const { docs: recDocs } = await payload.find({
      collection: 'movies',
      where: {
        id: {
          in: movieRecommendations
            .flatMap(({ like, dislike }: any) => [
              ...like.map((p: any) => p.payload?.movieId),
              ...dislike.map((p: any) => p.payload?.movieId),
            ])
            .filter(Boolean),
        },
      },
      limit: 1000,
    })
    const recDocById = new Map(recDocs.map((doc: any) => [doc.id, doc]))

    // Create a map of movieId to recommendations for proper mapping
    const recsByMovieId = new Map(movieRecommendations.map((rec) => [rec.movieId, rec]))

    // Build final results
    const results = movieDocs.map((movieDoc: any) => {
      const recs = recsByMovieId.get(movieDoc.id)

      return {
        ...movieDoc,
        recommendations: {
          like: recs?.like.map((p: any) => ({
            ...recDocById.get(p.payload?.movieId),
            score: p.score,
          })),
          dislike: recs?.dislike.map((p: any) => ({
            ...recDocById.get(p.payload?.movieId),
            score: p.score,
          })),
        },
      }
    })

    return NextResponse.json({
      success: true,
      results,
      totalFound: movieDocs.length,
      excluded: excluded.length,
    })
  } catch (e: any) {
    console.error('❌ Mood API error:', e)
    console.error('❌ Error details:', e.data || e.response?.data)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
