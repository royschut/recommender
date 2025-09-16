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

export const getMovieRecommendations = async (
  qdrant: QdrantClient,
  movieId: string,
  pointId: number,
  neutralVectorId: number,
) => {
  const filter = {
    must_not: [
      { key: 'type', match: { value: 'mood' } },
      { key: 'movieId', match: { value: movieId } },
    ],
  }

  const [like, dislike] = await Promise.all([
    // Like: similar movies
    qdrant.recommend(COLLECTION, {
      positive: [pointId],
      filter,
      limit: 10,
      with_payload: true,
    }),
    // Dislike: opposite movies using neutral vector
    qdrant.recommend(COLLECTION, {
      positive: [neutralVectorId],
      negative: [pointId],
      filter,
      limit: 10,
      with_payload: true,
    }),
  ])

  return { movieId, like, dislike }
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
  return movies.map((movie, i) => ({
    movieId: movie.payload?.movieId,
    like: results[i * 2],
    dislike: results[i * 2 + 1],
  }))
}
