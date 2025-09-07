import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY,
})

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
})

const COLLECTION_NAME = 'movie-embeddings'

export async function createMoodEmbedding(moodId: string, description: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: description,
    encoding_format: 'float',
  })

  // Generate numeric ID for Qdrant (similar to movie embeddings)
  const numericId = Date.now() + Math.floor(Math.random() * 100000)

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: numericId,
        vector: response.data[0].embedding,
        payload: {
          type: 'mood',
          moodId: moodId,
          description: description,
          updatedAt: new Date().toISOString(),
        },
      },
    ],
  })

  return String(numericId)
}

export async function updateMoodEmbedding(moodId: string, description: string) {
  return createMoodEmbedding(moodId, description)
}

export async function deleteMoodEmbedding(moodId: string) {
  // First find the point with this moodId in the payload
  const searchResult = await qdrant.scroll(COLLECTION_NAME, {
    filter: {
      must: [
        { key: 'type', match: { value: 'mood' } },
        { key: 'moodId', match: { value: moodId } },
      ],
    },
    with_payload: false,
    with_vector: false,
    limit: 1,
  })

  if (searchResult.points && searchResult.points.length > 0) {
    const pointId = searchResult.points[0].id
    await qdrant.delete(COLLECTION_NAME, {
      wait: true,
      points: [pointId],
    })
  }
}

export async function ensureMovieEmbeddingsCollection() {
  try {
    await qdrant.getCollection(COLLECTION_NAME)
  } catch {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: { size: 1536, distance: 'Cosine' },
    })
  }
}
