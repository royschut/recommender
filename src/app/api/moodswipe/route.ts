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

const combineVectors = (movieVector: number[], moodVector: number[], movieWeight = 0.5) =>
  normalize(movieVector.map((x, i) => x * movieWeight + moodVector[i] * (1 - movieWeight)))

const combineSimilarVectors = (movieVector: number[], moodVector: number[]) =>
  combineVectors(movieVector, moodVector, 0.5)

const combineContrastingVectors = (movieVector: number[], moodVector: number[]) =>
  combineVectors(movieVector, moodVector, 0.2)

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

    const movieIds = movies.map((movie) => movie.payload?.movieId as string).filter(Boolean)
    const pointByMovieId = new Map(movieIds.map((id, index) => [id, movies[index]]))

    const payload = await getPayload({ config: await config })
    const movieDocs = await payload.find({
      collection: 'movies',
      where: { id: { in: movieIds } },
      limit: movieIds.length,
    })
    const movieDocById = new Map(movieDocs.docs.map((doc: any) => [doc.id, doc]))

    // 2) Get Moods
    const moodBatch = await qdrant.queryBatch(COLLECTION, {
      searches: movies.map((movie) => ({
        query: movie.vector as number[],
        filter: { must: [{ key: 'type', match: { value: 'mood' } }] },
        limit: 24,
        with_payload: true,
        with_vector: true,
      })),
    })

    // 3) Combine per movie
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
        ? { ...bestMood, combinedVector: combineSimilarVectors(movieVector, bestMood.vector) }
        : undefined
      const contrastingSuggestion =
        worstMood && (!bestMood || worstMood.id !== bestMood.id)
          ? {
              ...worstMood,
              combinedVector: combineContrastingVectors(movieVector, worstMood.vector),
            }
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

    // Collect all recommended movie IDs for batch fetching
    const allRecommendedMovieIds = new Set<string>()
    recommendationSearches.forEach((search, i) => {
      const movieIds = (recommendationBatch[i]?.points ?? [])
        .map((p) => p.payload?.movieId as string)
        .filter(Boolean)
      movieIds.forEach((id) => allRecommendedMovieIds.add(id))
    })

    // Fetch full movie documents for all recommended movies
    const recommendedMovieDocs =
      allRecommendedMovieIds.size > 0
        ? await payload.find({
            collection: 'movies',
            where: { id: { in: Array.from(allRecommendedMovieIds) } },
            limit: allRecommendedMovieIds.size,
          })
        : { docs: [] }
    const recommendedMovieDocById = new Map(
      recommendedMovieDocs.docs.map((doc: any) => [doc.id, doc]),
    )

    const recommendationsByMovie = new Map<string, { similar?: any[]; contrasting?: any[] }>()
    recommendationSearches.forEach((search, i) => {
      const movies = (recommendationBatch[i]?.points ?? []).map((p) => {
        const movieDoc = recommendedMovieDocById.get(p.payload?.movieId)
        return movieDoc
          ? {
              ...movieDoc,
              score: p.score,
            }
          : {
              id: p.payload?.movieId,
              title: p.payload?.title || 'Unknown',
              score: p.score,
            }
      })
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
