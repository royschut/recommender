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
      id: rec.id,
    })) || []
  )
}

export const getRecommendationsForMoodProfile = async (
  qdrant: QdrantClient,
  moodProfile: Record<string, number> = {},
) => {
  const moodIds = Object.keys(moodProfile)
  let combinedVector: number[] = []
  let totalWeight = 0

  const validMoodIds = moodIds
    .map((id) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(id)) return id
      const num = Number(id)
      return !isNaN(num) && num > 0 ? num : null
    })
    .filter((id): id is string | number => id !== null)
  if (validMoodIds.length === 0) {
    return null
  }
  const moodPoints = await qdrant.retrieve(COLLECTION, {
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

  return qdrant.search(COLLECTION, {
    vector: combinedVector,
    filter: {
      must_not: [{ key: 'type', match: { value: 'mood' } }],
    },
    limit: 20,
    with_payload: true,
    with_vector: false,
  })
}
