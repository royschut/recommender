import { QdrantClient } from '@qdrant/js-client-rest'

const COLLECTION = 'movie-embeddings'

export const getRandomMovies = async (qdrant: QdrantClient, excluded: string[]) => {
  return qdrant.query(COLLECTION, {
    query: { sample: 'random' },
    filter: excluded.length
      ? { must_not: [{ key: 'movieId', match: { any: excluded } }] }
      : undefined,
    with_payload: true,
    with_vector: true,
    limit: 10,
  })
}

export const getRecommendationsForUserProfile = async (
  qdrant: QdrantClient,
  userProfile: Array<{ movieId: string; action: 'like' | 'dislike' }>,
  excluded: string[],
) => {
  // Get all movie IDs from userProfile
  const allMovieIds = userProfile.map((action) => action.movieId)

  // Find the Qdrant points for these movies
  const { points } = await qdrant.scroll(COLLECTION, {
    filter: {
      must: [{ key: 'movieId', match: { any: allMovieIds } }],
    },
    with_payload: true,
    limit: allMovieIds.length,
  })

  // Map to positive/negative point IDs
  const positive = points
    .filter((p) => {
      const movieId = p.payload?.movieId as string
      return userProfile.some((action) => action.movieId === movieId && action.action === 'like')
    })
    .map((p) => p.id)

  const negative = points
    .filter((p) => {
      const movieId = p.payload?.movieId as string
      return userProfile.some((action) => action.movieId === movieId && action.action === 'dislike')
    })
    .map((p) => p.id)

  return qdrant.recommend(COLLECTION, {
    positive,
    negative,
    filter: {
      must_not: [
        { key: 'type', match: { value: 'mood' } },
        { key: 'movieId', match: { any: allMovieIds } },
      ],
    },
    limit: 10,
    with_payload: true,
    with_vector: true,
  })
}

export const getBatchMovieRecommendations = async (
  qdrant: QdrantClient,
  movies: any[],
  neutralVectorId: number,
) => {
  const searches = movies.flatMap(({ id, payload }) => {
    const movieId = payload?.movieId
    const filter = {
      must_not: [
        { key: 'type', match: { value: 'mood' } },
        { key: 'movieId', match: { value: movieId } },
      ],
    }

    return [
      {
        positive: [id],
        filter,
        limit: 10,
        with_payload: true,
      },
      {
        positive: [neutralVectorId],
        negative: [id],
        filter,
        limit: 10,
        with_payload: true,
      },
    ]
  })

  const results = await qdrant.recommendBatch(COLLECTION, { searches })

  // Group results back into like/dislike pairs per movie
  // Each movie generates 2 searches (like, dislike), so results[i*2] = like, results[i*2+1] = dislike
  return movies.map((movie, i) => ({
    movieId: movie.payload?.movieId,
    like: results[i * 2] || [],
    dislike: results[i * 2 + 1] || [],
  }))
}

export async function getAllMoods(
  qdrant: QdrantClient,
  userProfile: Array<{ movieId: string; action: 'like' | 'dislike' }> = [],
) {
  if (!userProfile?.length) {
    return []
  }

  const allMovieIds = userProfile.map((a) => a.movieId)
  const { points: profilePoints } = await qdrant.scroll(COLLECTION, {
    filter: { must: [{ key: 'movieId', match: { any: allMovieIds } }] },
    with_payload: true,
    limit: allMovieIds.length,
  })

  const positive = profilePoints
    .filter((p) =>
      userProfile.some((u) => u.movieId === (p.payload as any)?.movieId && u.action === 'like'),
    )
    .map((p) => p.id)
  const negative = profilePoints
    .filter((p) =>
      userProfile.some((u) => u.movieId === (p.payload as any)?.movieId && u.action === 'dislike'),
    )
    .map((p) => p.id)

  if (!positive.length && !negative.length) {
    return []
  }

  const recs = await qdrant.recommend(COLLECTION, {
    positive: positive.length ? positive : undefined,
    negative: negative.length ? negative : undefined,
    filter: {
      must: [{ key: 'type', match: { value: 'mood' } }],
    },
    limit: 24,
    with_payload: true,
  })

  return (
    recs.map((rec) => ({
      title: rec.payload?.title,
      description: rec.payload?.description,
      score: rec.score,
    })) || []
  )
}
