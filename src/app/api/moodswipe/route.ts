import { NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const excludedParam = searchParams.get('excluded')
    const excludedIds = excludedParam ? excludedParam.split(',').filter(Boolean) : []

    const searchResults = await qdrant.query('movie-embeddings', {
      query: { sample: 'random' },
      with_payload: true,
      with_vector: false,
      limit: 10,
      filter: { must_not: [{ key: 'movieId', match: { any: excludedIds } }] },
    })

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

    return NextResponse.json({
      success: true,
      results: movies.docs,
      totalFound: movies.totalDocs,
      excluded: excludedIds.length,
    })
  } catch (error: any) {
    console.error('❌ MoodSwipe GET API error:', error)
    return NextResponse.json(
      { success: false, error: 'Error while fetching movies', details: error.message },
      { status: 500 },
    )
  }
}
