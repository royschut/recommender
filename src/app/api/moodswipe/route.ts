import { NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
})

// Util function to explore mood vectors
async function exploreMoodVectors() {
  try {
    console.log('🔍 Exploring mood vectors in movie-embeddings collection...')

    const info = await qdrant.getCollection('movie-embeddings')
    console.log(JSON.stringify(info?.config?.params?.vectors, null, 2))

    // Get all mood vectors (type='mood')
    const moodPoints = await qdrant.scroll('movie-embeddings', {
      filter: {
        must: [{ key: 'type', match: { value: 'mood' } }],
      },
      with_payload: true,
      with_vector: true,
      limit: 100,
    })

    console.log(`📄 Found ${moodPoints.points?.length || 0} mood vectors`)

    if (moodPoints.points && moodPoints.points.length > 0) {
      console.log('🏷️ Mood vectors:')
      moodPoints.points.forEach((point, index) => {
        console.log(`Mood ${index + 1}:`, {
          id: point.id,
          moodId: point.payload?.moodId,
          description: point.payload?.description,
          updatedAt: point.payload?.updatedAt,
        })
        if (index === 0) {
          console.log('First mood vector payload:', point.vector)
        }
      })

      // Analyze payload structure
      const payloadKeys = new Set()
      moodPoints.points.forEach((point) => {
        if (point.payload) {
          Object.keys(point.payload).forEach((key) => payloadKeys.add(key))
        }
      })
      console.log('🔑 Mood payload keys:', Array.from(payloadKeys))
    }

    return moodPoints.points
  } catch (error: any) {
    console.error('❌ Error exploring mood vectors:', error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    // Test: explore mood vectors
    // await exploreMoodVectors()

    const body = await request.json()
    const excludedIds = body.excluded || []
    const collectionName = 'movie-embeddings'

    const queryOptions: any = {
      query: { sample: 'random' },
      with_payload: true,
      with_vector: false,
      limit: 10,
    }

    // Only add filter if there are excluded IDs
    if (excludedIds.length > 0) {
      queryOptions.filter = {
        must_not: [{ key: 'movieId', match: { any: excludedIds } }],
      }
    }

    const searchResults = await qdrant.query(collectionName, queryOptions)

    if (!searchResults.points?.length) {
      return NextResponse.json({
        success: true,
        results: [],
        totalFound: 0,
        method: 'random_sample',
        excluded: excludedIds.length,
      })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const movieIds = searchResults.points
      .map((point: any) => point.payload?.movieId)
      .filter(Boolean)

    const movies = await payload.find({
      collection: 'movies',
      where: { id: { in: movieIds } },
      limit: movieIds.length,
    })

    // Get mood scores for all movies using Qdrant's batch query
    const moodBatchResults = await qdrant.queryBatch(collectionName, {
      searches:
        searchResults.points
          ?.filter((point: any) => point.payload?.movieId)
          .map((point: any) => ({
            query: point.id,
            filter: { must: [{ key: 'type', match: { value: 'mood' } }] },
            limit: 24,
            with_payload: true,
            search_params: { exact: true },
          })) || [],
    })

    // Add mood scores to movies
    const moviesWithMoodScores = movies.docs.map((movie: any, index: number) => {
      const moodResults = moodBatchResults[index]?.points || []
      const moodScores: { [mood: string]: { score: number; title: string } } = {}

      moodResults.forEach((result: any) => {
        const moodId = result.payload?.moodId as string
        const moodTitle =
          (result.payload?.title as string) || (result.payload?.description as string) || 'Unknown'
        if (moodId) {
          moodScores[moodId] = { score: result.score, title: moodTitle }
        }
      })

      return { ...movie, moodScores }
    })

    return NextResponse.json({
      success: true,
      results: moviesWithMoodScores,
      totalFound: movies.totalDocs,
      excluded: excludedIds.length,
    })
  } catch (error: any) {
    console.error('❌ MoodSwipe POST API error:', error)
    return NextResponse.json(
      { success: false, error: 'Error while fetching movies', details: error.message },
      { status: 500 },
    )
  }
}
