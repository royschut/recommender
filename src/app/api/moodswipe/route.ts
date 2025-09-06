import { NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
})

export async function GET() {
  try {
    const collectionName = 'movie-embeddings'
    const limit = 30

    const searchResults = await qdrant.query(collectionName, {
      query: { sample: 'random' },
      with_payload: true,
      with_vector: false,
      limit: limit,
    })

    if (!searchResults.points?.length) {
      return NextResponse.json({
        success: true,
        results: [],
        totalFound: 0,
        method: 'random_sample',
      })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const movies = await payload.find({
      collection: 'movies',
      where: {
        id: {
          in: searchResults.points.map((point: any) => point.payload?.movieId).filter(Boolean),
        },
      },
      limit: searchResults.points.length,
    })

    return NextResponse.json({
      success: true,
      results: movies.docs,
      totalFound: movies.totalDocs,
      method: 'random_sample',
    })
  } catch (error: any) {
    console.error('❌ MoodSwipe GET API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Er is een fout opgetreden bij het ophalen van films',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
