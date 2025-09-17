import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  getRandomMovies,
  getRecommendationsForUserProfile,
  getAllMoods,
  getRecommendationsForMoodProfile,
} from './utils'
import { NextResponse } from 'next/server'

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env.QDRANT_API_KEY })

export async function POST(req: Request) {
  try {
    const { excluded = [], userProfile = [], getMoods, moodProfile } = await req.json()

    if (getMoods) {
      const moods = await getAllMoods(qdrant, userProfile)

      return NextResponse.json({
        success: true,
        results: moods,
      })
    }

    if (moodProfile) {
      const movieResults = await getRecommendationsForMoodProfile(qdrant, moodProfile)
      const payload = await getPayload({ config: await config })
      const movieIds = movieResults?.map((m: any) => m.payload?.movieId as string).filter(Boolean)
      const { docs: movieDocs } = await payload.find({
        collection: 'movies',
        where: { id: { in: movieIds } },
        limit: movieIds?.length,
      })
      return NextResponse.json({
        success: true,
        results: movieDocs,
        totalFound: movieDocs.length,
      })
    }

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

    // Haal alle moods op vlak voor de response (inclusief scoring op basis van userProfile)

    return NextResponse.json({
      success: true,
      results: movieDocs,
      totalFound: movieDocs.length,
      excluded: excluded.length,
    })
  } catch (e: any) {
    console.error('❌ Mood API error:', e)
    console.error('❌ Error details:', e.data || e.response?.data)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
