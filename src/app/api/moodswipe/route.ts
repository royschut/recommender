import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getRandomMovies, getRecommendationsForUserProfile, getAllMoods } from './utils'
import { NextResponse } from 'next/server'

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env.QDRANT_API_KEY })
const MOOD_COLLECTION = 'movie-embeddings'

export async function POST(req: Request) {
  try {
    const { excluded = [], userProfile = [], getMoods, moodProfile } = await req.json()

    if (moodProfile) {
      const moodIds = Object.keys(moodProfile)
      let combinedVector: number[] = []
      let totalWeight = 0

      // Filter en converteer IDs
      const validMoodIds = moodIds
        .map((id) => {
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          if (uuidRegex.test(id)) return id
          const num = Number(id)
          return !isNaN(num) && num > 0 ? num : null
        })
        .filter((id): id is string | number => id !== null)
      if (validMoodIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid mood IDs found.' },
          { status: 400 },
        )
      }
      const moodPoints = await qdrant.retrieve(MOOD_COLLECTION, {
        ids: validMoodIds,
        with_vector: true,
      })
      for (const point of moodPoints) {
        const moodId = String(point.id)
        const weight = moodProfile[moodId]
        let vector: number[] | undefined = undefined
        if (Array.isArray(point.vector)) {
          vector = point.vector.map((v) => (typeof v === 'number' ? v : Number(v)))
        } else if (point.vector && typeof point.vector === 'object' && 'values' in point.vector) {
          vector = Array.isArray(point.vector.values)
            ? point.vector.values.map((v) => (typeof v === 'number' ? v : Number(v)))
            : undefined
        }
        if (vector && typeof weight === 'number') {
          if (combinedVector.length === 0) {
            combinedVector = vector.map((v) => v * weight)
          } else {
            combinedVector = combinedVector.map((v, i) => v + vector![i] * weight)
          }
          totalWeight += weight
        }
      }
      if (totalWeight > 0) {
        combinedVector = combinedVector.map((v) => v / totalWeight)
      }
      // Zoek movies met deze samengestelde vector via utils (filter op type != mood)
      const movieResults = await qdrant.search(MOOD_COLLECTION, {
        vector: combinedVector,
        filter: {
          must_not: [{ key: 'type', match: { value: 'mood' } }],
        },
        limit: 20,
        with_payload: true,
        with_vector: false,
      })

      return NextResponse.json({
        success: true,
        results: movieResults,
        totalFound: movieResults.length,
      })
    }

    if (getMoods) {
      const moods = await getAllMoods(qdrant, userProfile)

      return NextResponse.json({
        success: true,
        results: moods,
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
