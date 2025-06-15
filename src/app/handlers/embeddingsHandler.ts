import { PayloadHandler } from 'payload'
import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'

const embeddingsHandler: PayloadHandler = async ({ payload, searchParams }) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY })
    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    })
    const collectionName = 'movie-embeddings'

    // Always reset Qdrant collection to ensure clean state
    console.log('Resetting Qdrant collection...')
    await qdrant.deleteCollection(collectionName).catch(console.error)
    await qdrant
      .createCollection(collectionName, {
        vectors: { size: 1536, distance: 'Cosine' },
      })
      .catch(console.error)

    // Reset all movie embedding flags
    console.log('Resetting movie embedding flags...')
    try {
      await payload.update({
        collection: 'movies',
        where: {},
        data: {
          qdrantId: null,
          hasEmbedding: false,
        },
      })
    } catch (resetError) {
      console.error('Error resetting movie flags:', resetError)
    }

    // Fetch all movies from Payload
    const movies = await payload.find({
      collection: 'movies',
      limit: 0,
      select: {
        id: true,
        title: true,
        overview: true,
        genres: true,
        originalTitle: true,
        qdrantId: true,
        hasEmbedding: true,
      },
    })

    // Process each movie to create embeddings
    let totalProcessed = 0
    const errors: string[] = []

    console.log(`Processing embeddings for ${movies.docs.length} movies...`)

    for (const movie of movies.docs) {
      try {
        // Skip check for existing embeddings since we reset everything

        const genresText = movie.genres?.map((g: any) => g.genre).join(', ') || ''
        const textToEmbed = [
          movie.title,
          movie.originalTitle !== movie.title ? movie.originalTitle : '',
          movie.overview || '',
          genresText && `Genres: ${genresText}`,
        ]
          .filter(Boolean)
          .join('. ')

        if (!textToEmbed.trim()) continue

        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: textToEmbed,
          encoding_format: 'float',
        })

        const numericId = Date.now() + Math.floor(Math.random() * 1000)

        await qdrant.upsert(collectionName, {
          wait: true,
          points: [
            {
              id: numericId,
              vector: embeddingResponse.data[0].embedding,
              payload: {
                movieId: String(movie.id),
                title: String(movie.title || ''),
                overview: String(movie.overview || ''),
                genres: String(genresText || ''),
              },
            },
          ],
        })

        await payload.update({
          collection: 'movies',
          id: movie.id,
          data: {
            qdrantId: String(numericId),
            hasEmbedding: true,
          },
        })

        totalProcessed++
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (movieError: any) {
        errors.push(`Error processing movie "${movie.title}": ${movieError.message}`)
      }
    }

    return Response.json({
      success: true,
      message: `Embeddings processing completed`,
      totalMovies: movies.docs.length,
      totalProcessed,
      totalErrors: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    return Response.json(
      {
        error: 'Failed to process embeddings',
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export default embeddingsHandler
