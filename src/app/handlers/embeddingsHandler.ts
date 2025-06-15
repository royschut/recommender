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

    console.log('Resetting movie embedding flags (optimized)...')
    try {
      // Use direct database access for faster clearing
      const result = await payload.db.collections.movies.updateMany(
        {},
        { $set: { qdrantId: null, hasEmbedding: false } },
      )
      console.log(`Reset ${result.modifiedCount} movie embedding flags`)
    } catch (resetError) {
      // Fallback to Payload update if direct access fails
      try {
        await payload.update({
          collection: 'movies',
          where: {},
          data: {
            qdrantId: null,
            hasEmbedding: false,
          },
        })
        console.log('Reset movie embedding flags (fallback)')
      } catch (fallbackError) {
        console.error('Error resetting movie flags:', fallbackError)
      }
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

    console.log(`Processing embeddings for ${movies.docs.length} movies in batches...`)

    // OPTIMIZATION 1: Batch OpenAI embedding calls
    const EMBEDDING_BATCH_SIZE = 100 // OpenAI allows up to 100 inputs per request
    const QDRANT_BATCH_SIZE = 50 // Qdrant batch size for upserts

    let totalProcessed = 0
    const errors: string[] = []

    // Process movies in batches
    for (let i = 0; i < movies.docs.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = movies.docs.slice(i, i + EMBEDDING_BATCH_SIZE)

      try {
        console.log(
          `Processing embedding batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}: ${batch.length} movies`,
        )

        // Prepare texts for batch embedding
        const textsToEmbed: string[] = []
        const movieMetadata: Array<{
          movie: any
          textIndex: number
          genresText: string
        }> = []

        batch.forEach((movie, index) => {
          const genresText = movie.genres?.map((g: any) => g.genre).join(', ') || ''
          const textToEmbed = [
            movie.title,
            movie.originalTitle !== movie.title ? movie.originalTitle : '',
            movie.overview || '',
            genresText && `Genres: ${genresText}`,
          ]
            .filter(Boolean)
            .join('. ')

          if (textToEmbed.trim()) {
            textsToEmbed.push(textToEmbed)
            movieMetadata.push({
              movie,
              textIndex: textsToEmbed.length - 1,
              genresText,
            })
          }
        })

        if (textsToEmbed.length === 0) continue

        // BATCH OPENAI CALL: Get embeddings for all texts at once
        console.log(`  Creating ${textsToEmbed.length} embeddings...`)
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: textsToEmbed,
          encoding_format: 'float',
        })

        // Prepare Qdrant points and Payload updates
        const qdrantPoints: any[] = []
        const payloadUpdates: Array<{ id: string; data: any }> = []

        movieMetadata.forEach(({ movie, textIndex, genresText }) => {
          const numericId = Date.now() + Math.floor(Math.random() * 100000) + textIndex
          const embedding = embeddingResponse.data[textIndex]

          qdrantPoints.push({
            id: numericId,
            vector: embedding.embedding,
            payload: {
              movieId: String(movie.id),
              title: String(movie.title || ''),
              overview: String(movie.overview || ''),
              genres: String(genresText || ''),
            },
          })

          payloadUpdates.push({
            id: movie.id,
            data: {
              qdrantId: String(numericId),
              hasEmbedding: true,
            },
          })
        })

        // Batch Qdrant upserts
        console.log(`  Upserting ${qdrantPoints.length} vectors to Qdrant...`)
        for (let j = 0; j < qdrantPoints.length; j += QDRANT_BATCH_SIZE) {
          const qdrantBatch = qdrantPoints.slice(j, j + QDRANT_BATCH_SIZE)

          await qdrant.upsert(collectionName, {
            wait: true,
            points: qdrantBatch,
          })
        }

        console.log(`  Updating ${payloadUpdates.length} movie records...`)
        try {
          // Use direct MongoDB bulk operations for massive speed improvement
          const bulkOps = payloadUpdates.map(({ id, data }) => ({
            updateOne: {
              filter: { _id: id },
              update: { $set: data },
            },
          }))

          const bulkResult = await payload.db.collections.movies.bulkWrite(bulkOps)
          const batchSuccessCount = bulkResult.modifiedCount

          totalProcessed += batchSuccessCount
          console.log(
            `  Batch completed: ${batchSuccessCount}/${payloadUpdates.length} movies processed (optimized)`,
          )
        } catch (bulkError: any) {
          // Fallback to individual Payload updates if bulk operation fails
          console.log(`  Bulk update failed, falling back to individual updates...`)
          const updatePromises = payloadUpdates.map(({ id, data }) =>
            payload.update({
              collection: 'movies',
              id,
              data,
            }),
          )

          const updateResults = await Promise.allSettled(updatePromises)

          // Count successful updates
          let batchSuccessCount = 0
          updateResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              batchSuccessCount++
            } else {
              errors.push(`Error updating movie ${payloadUpdates[index].id}: ${result.reason}`)
            }
          })

          totalProcessed += batchSuccessCount
          console.log(
            `  Batch completed: ${batchSuccessCount}/${payloadUpdates.length} movies processed (fallback)`,
          )
        }
      } catch (batchError: any) {
        errors.push(
          `Error processing batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}: ${batchError.message}`,
        )
        console.error(`Batch error:`, batchError)
      }

      // Small delay between batches to avoid overwhelming the APIs
      if (i + EMBEDDING_BATCH_SIZE < movies.docs.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    return Response.json({
      success: true,
      message: `Optimized embeddings processing completed`,
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
