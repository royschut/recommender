import { NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env.QDRANT_API_KEY })
const COLLECTION = 'movie-embeddings'

export async function POST(req: Request) {
  try {
    const { excluded = [] } = await req.json()

    // Get random movies with vectors
    const { points: movies = [] } = await qdrant.query(COLLECTION, {
      query: { sample: 'random' },
      filter: excluded.length
        ? { must_not: [{ key: 'movieId', match: { any: excluded } }] }
        : undefined,
      with_payload: true,
      with_vector: true, // Need vectors for dislike search
      limit: 10,
    })

    if (!movies.length) return NextResponse.json({ success: true, results: [], totalFound: 0 })

    const movieIds = movies.map((m) => m.payload?.movieId as string).filter(Boolean)
    const moviePointIds = movies.map((m) => m.id).filter(Boolean) // Get Qdrant point IDs

    // Fetch movie documents
    const payload = await getPayload({ config: await config })
    const { docs: movieDocs } = await payload.find({
      collection: 'movies',
      where: { id: { in: movieIds } },
      limit: movieIds.length,
    })
    const movieDocById = new Map(movieDocs.map((doc: any) => [doc.id, doc]))

    // Generate like/dislike recommendations using Qdrant point IDs
    const recommendations = await Promise.all(
      moviePointIds.flatMap((pointId, index) => {
        const movieId = movieIds[index] // Get corresponding movieId for filtering
        // Get other movie IDs for dislike (use other movies as positive examples, current as negative)
        const otherPointIds = moviePointIds.filter((id) => id !== pointId)

        return [
          // Like: similar to current movie
          qdrant.recommend(COLLECTION, {
            positive: [pointId],
            filter: {
              must_not: [
                { key: 'type', match: { value: 'mood' } },
                { key: 'movieId', match: { value: movieId } },
              ],
            },
            limit: 10,
            with_payload: true,
          }),
          // Dislike: use search with inverted vector
          qdrant.search(COLLECTION, {
            vector: (movies[index].vector as number[]).map((x) => -x), // Invert vector for dissimilar results
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
    const allRecIds = recommendations
      .flat()
      .map((p) => p.payload?.movieId)
      .filter(Boolean) as string[]
    const { docs: recDocs } = allRecIds.length
      ? await payload.find({
          collection: 'movies',
          where: { id: { in: allRecIds } },
          limit: allRecIds.length,
        })
      : { docs: [] }
    const recDocById = new Map(recDocs.map((doc: any) => [doc.id, doc]))

    // Build final results
    const results = movieIds.map((movieId, i) => {
      const mapRecs = (points: any[]) =>
        points.map((p) => ({
          ...(recDocById.get(p.payload?.movieId) || { id: p.payload?.movieId, title: 'Unknown' }),
          score: p.score,
        }))

      return {
        ...movieDocById.get(movieId),
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
