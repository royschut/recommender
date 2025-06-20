import { PayloadHandler } from 'payload'
import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'

const conceptVectorsHandler: PayloadHandler = async ({ payload, searchParams }) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY })
    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    })

    const collectionName = 'concept-vectors'

    // Concept definitions
    const concepts = {
      adventure:
        'adventurous action-packed thrilling exciting dynamic fast-paced energetic intense physical movement exploration danger stunts chase sequences combat fighting battles war conflict explosive dramatic tension suspense adrenaline pumping high stakes life or death scenarios',

      romance:
        'romantic love intimate emotional relationship tender passionate heartfelt sentimental affectionate couples dating marriage wedding proposal kiss embrace chemistry connection soul mate true love heartbreak breakup reunion passionate affair forbidden love triangle romantic comedy drama',

      complexity:
        'complex deep intellectual philosophical thought-provoking intricate sophisticated layered nuanced cerebral analytical psychological mind-bending plot twists multiple timelines non-linear narrative symbolism metaphor allegory abstract conceptual theoretical academic scholarly profound meaningful',

      emotion:
        'emotional intense dramatic powerful moving touching heartbreaking uplifting cathartic overwhelming profound affecting tear-jerking inspirational motivational depression grief loss trauma healing redemption hope despair joy sadness anger fear anxiety therapeutic',

      realism:
        'realistic grounded true-to-life authentic documentary-style natural believable everyday ordinary mundane practical factual slice-of-life naturalistic gritty raw unvarnished honest straightforward down-to-earth relatable human realistic dialogue believable characters',
    }

    console.log('🚀 Generating concept embeddings and storing in Qdrant...')

    // Delete existing collection if it exists
    try {
      await qdrant.deleteCollection(collectionName)
      console.log('🗑️  Deleted existing concept-vectors collection')
    } catch (error) {
      console.log('ℹ️  No existing concept-vectors collection found')
    }

    // Create new collection for concept vectors
    await qdrant.createCollection(collectionName, {
      vectors: { size: 1536, distance: 'Cosine' }, // text-embedding-3-small is 1536 dimensions
    })
    console.log('✅ Created concept-vectors collection')

    const points = []

    for (const [key, description] of Object.entries(concepts)) {
      console.log(`📊 Generating embedding for: ${key}`)

      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: description,
          encoding_format: 'float',
        })

        const vector = response.data[0].embedding

        // Add to points array for batch upsert
        points.push({
          id: key, // Use concept name as ID
          vector: vector,
          payload: {
            concept: key,
            description: description,
            createdAt: new Date().toISOString(),
          },
        })

        console.log(`✅ Generated ${vector.length}-dimensional vector for ${key}`)

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error: any) {
        console.error(`❌ Error generating embedding for ${key}:`, error.message)
        return Response.json(
          { error: `Failed to generate embedding for ${key}: ${error.message}` },
          { status: 500 },
        )
      }
    }

    // Upsert all points to Qdrant
    if (points.length > 0) {
      await qdrant.upsert(collectionName, {
        wait: true,
        points: points,
      })
      console.log(`🎯 Successfully stored ${points.length} concept vectors in Qdrant`)
    }

    // Verify the collection
    const info = await qdrant.getCollection(collectionName)
    console.log(`📈 Collection info: ${info.points_count} points stored`)

    console.log('\n🎉 Concept embeddings generated and stored in Qdrant successfully!')

    return Response.json({
      success: true,
      message: 'Concept vectors generated and stored successfully',
      collection: collectionName,
      conceptsGenerated: points.length,
      totalPointsInCollection: info.points_count,
      concepts: points.map((p) => p.id),
    })
  } catch (error: any) {
    console.error('❌ Concept vectors generation error:', error)
    return Response.json(
      {
        error: 'Failed to generate concept vectors',
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export default conceptVectorsHandler
