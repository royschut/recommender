import { NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env.QDRANT_API_KEY })
const COLLECTION = 'movie-embeddings'

const randomMovies = async (excluded: string[]) => {
  return qdrant.query(COLLECTION, {
    query: { sample: 'random' },
    filter: excluded.length
      ? { must_not: [{ key: 'movieId', match: { any: excluded } }] }
      : undefined,
    with_payload: true,
    with_vector: true, // Need vectors for dislike search
    limit: 10,
  })
}

export async function POST(req: Request) {
  try {
    const { excluded = [] } = await req.json()

    // 1. Get random movies vectors
    const { points: movies } = await randomMovies(excluded)

    if (!movies.length) return NextResponse.json({ success: true, results: [], totalFound: 0 })

    const payload = await getPayload({ config: await config })
    const movieIds = movies.map((m) => m.payload?.movieId as string).filter(Boolean)
    const { docs: movieDocs } = await payload.find({
      collection: 'movies',
      where: { id: { in: movieIds } },
      limit: movieIds.length,
    })

    // Use existing neutral mood vector for first dislike recommendations
    const neutralVectorId = 1758054612634 // Existing empty mood vector (as number)

    // 2. Generate like/dislike recommendations using Qdrant point IDs
    const recommendations = await Promise.all(
      movies.flatMap(({ id, payload: moviePayload }) => {
        const movieId = moviePayload?.movieId

        return [
          // Like: similar to current movie using recommend API
          qdrant.recommend(COLLECTION, {
            positive: [id],
            filter: {
              must_not: [
                { key: 'type', match: { value: 'mood' } },
                { key: 'movieId', match: { value: movieId } },
              ],
            },
            limit: 10,
            with_payload: true,
          }),
          // Dislike: use recommend with neutral vector as positive and current movie as negative
          qdrant.recommend(COLLECTION, {
            positive: [neutralVectorId], // Neutral vector point as positive
            negative: [id], // Current movie as negative
            filter: {
              must_not: [
                { key: 'type', match: { value: 'mood' } },
                { key: 'movieId', match: { value: movieId } },
              ],
            },
            limit: 10,
            with_payload: true,
          }),
        ]
      }),
    )

    // Get all rec movie IDs and fetch docs in one go
    const allRecIds = recommendations.flat().map((p) => p.payload?.movieId)
    const { docs: recDocs } = allRecIds.length
      ? await payload.find({
          collection: 'movies',
          where: { id: { in: allRecIds } },
          limit: allRecIds.length,
        })
      : { docs: [] }
    const recDocById = new Map(recDocs.map((doc: any) => [doc.id, doc]))

    // Build final results
    const results = movieDocs.map((movieDoc, i) => {
      const mapRecs = (points: any[]) =>
        points.map((p) => ({
          ...(recDocById.get(p.payload?.movieId) || { id: p.payload?.movieId, title: 'Unknown' }),
          score: p.score,
        }))

      return {
        ...movieDoc,
        recommendations: {
          like: mapRecs(recommendations[i * 2] || []),
          dislike: mapRecs(recommendations[i * 2 + 1] || []),
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
