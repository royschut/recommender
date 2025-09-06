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

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: moodId,
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

  return moodId
}

export async function updateMoodEmbedding(moodId: string, description: string) {
  return createMoodEmbedding(moodId, description)
}

export async function deleteMoodEmbedding(moodId: string) {
  await qdrant.delete(COLLECTION_NAME, {
    wait: true,
    points: [moodId],
  })
}

export async function ensureConceptVectorsCollection() {
  try {
    await qdrant.getCollection(COLLECTION_NAME)
  } catch {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: { size: 1536, distance: 'Cosine' },
    })
  }
}
