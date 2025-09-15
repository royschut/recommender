import { NextResponse } from 'next/server'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env.QDRANT_API_KEY })
const COLLECTION = 'movie-embeddings'

const normalize = (vector: number[]) => {
  const length = Math.hypot(...vector)
  return length ? vector.map((x) => x / length) : vector
}
const combineVectors = (movieVector: number[], moodVector: number[], movieWeight = 0.7) =>
  normalize(movieVector.map((x, i) => x * movieWeight + moodVector[i] * (1 - movieWeight)))

export async function POST(req: Request) {
  try {
    const { excluded = [] } = await req.json()

    // 1) Random movies
    const { points: movies = [] } = await qdrant.query(COLLECTION, {
      query: { sample: 'random' },
      filter: excluded.length
        ? { must_not: [{ key: 'movieId', match: { any: excluded } }] }
        : undefined,
      with_payload: true,
      with_vector: true,
      limit: 10,
    })

    if (!movies.length) return NextResponse.json({ success: true, results: [], totalFound: 0 })

    const movieIds = movies.map((movie) => movie.payload?.movieId).filter(Boolean)
    const pointByMovieId = new Map(movieIds.map((id, index) => [id, movies[index]]))

    // 2) Movie docs
    const payload = await getPayload({ config: await config })
    const movieDocs = await payload.find({
      collection: 'movies',
      where: { id: { in: movieIds } },
      limit: movieIds.length,
    })
    const movieDocById = new Map(movieDocs.docs.map((doc: any) => [doc.id, doc]))

    // 3) Moods
    const moodBatch = await qdrant.queryBatch(COLLECTION, {
      searches: movies.map((movie) => ({
        query: movie.vector as number[],
        filter: { must: [{ key: 'type', match: { value: 'mood' } }] },
        limit: 24,
        with_payload: true,
        with_vector: true,
      })),
    })

    // 4) Combine per movie
    const moviesWithSuggestions = movieIds.map((movieId, index) => {
      const movieVector = pointByMovieId.get(movieId)?.vector as number[]
      const moods = (moodBatch[index]?.points ?? [])
        .map((m) => ({
          id: m.payload?.moodId,
          title: m.payload?.title || m.payload?.description || 'Unknown',
          score: m.score!,
          vector: m.vector as number[],
        }))
        .filter((x) => x.id && x.vector)
        .sort((a, b) => b.score - a.score)

      const bestMood = moods[0]
      const worstMood = moods[moods.length - 1]

      const similarSuggestion = bestMood
        ? { ...bestMood, combinedVector: combineVectors(movieVector, bestMood.vector) }
        : undefined
      const contrastingSuggestion =
        worstMood && (!bestMood || worstMood.id !== bestMood.id)
          ? { ...worstMood, combinedVector: combineVectors(movieVector, worstMood.vector) }
          : undefined

      return {
        movieId,
        doc: movieDocById.get(movieId) ?? { id: movieId },
        similarSuggestion,
        contrastingSuggestion,
      }
    })

    // 5) Batch recommendations
    const recommendationSearches = moviesWithSuggestions.flatMap(
      (item) =>
        [
          item.similarSuggestion && {
            query: item.similarSuggestion.combinedVector,
            kind: 'similar',
            movieId: item.movieId,
          },
          item.contrastingSuggestion && {
            query: item.contrastingSuggestion.combinedVector,
            kind: 'contrasting',
            movieId: item.movieId,
          },
        ].filter(Boolean) as Array<{
          query: number[]
          kind: 'similar' | 'contrasting'
          movieId: string
        }>,
    )

    const recommendationBatch = recommendationSearches.length
      ? await qdrant.queryBatch(COLLECTION, {
          searches: recommendationSearches.map((s) => ({
            query: s.query,
            filter: {
              must_not: [
                { key: 'type', match: { value: 'mood' } },
                { key: 'movieId', match: { value: s.movieId } },
              ],
            },
            limit: 5,
            with_payload: true,
          })),
        })
      : []

    const recommendationsByMovie = new Map<string, { similar?: any[]; contrasting?: any[] }>()
    recommendationSearches.forEach((search, i) => {
      const movies = (recommendationBatch[i]?.points ?? []).map((p) => ({
        id: p.payload?.movieId,
        title: p.payload?.title,
        score: p.score,
      }))
      const entry = recommendationsByMovie.get(search.movieId) ?? {}
      entry[search.kind] = movies
      recommendationsByMovie.set(search.movieId, entry)
    })

    // 6) Final output
    const results = moviesWithSuggestions.map((item) => {
      const recs = recommendationsByMovie.get(item.movieId) ?? {}
      const moodSuggestions: any = {}
      if (item.similarSuggestion) {
        moodSuggestions.similar = {
          id: item.similarSuggestion.id,
          title: item.similarSuggestion.title,
          score: item.similarSuggestion.score,
          recommendedMovies: recs.similar ?? [],
        }
      }
      if (item.contrastingSuggestion) {
        moodSuggestions.contrasting = {
          id: item.contrastingSuggestion.id,
          title: item.contrastingSuggestion.title,
          score: item.contrastingSuggestion.score,
          recommendedMovies: recs.contrasting ?? [],
        }
      }
      return { ...(item.doc as any), moodSuggestions }
    })

    return NextResponse.json({
      success: true,
      results,
      totalFound: movieDocs.totalDocs ?? results.length,
      excluded: excluded.length,
    })
  } catch (e: any) {
    console.error('❌ Mood API error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
