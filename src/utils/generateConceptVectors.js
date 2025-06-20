/**
 * Utility script to generate concept embeddings
 * Run this once to generate the concept vectors that can be used in the search API
 */

import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Load environment variables directly
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY,
})

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
})

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

async function generateConceptEmbeddings() {
  console.log('🚀 Generating concept embeddings and storing in Qdrant...')

  const collectionName = 'concept-vectors'

  try {
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
    const conceptIds = {} // Mapping from concept name to numeric ID
    let currentId = 1

    for (const [key, description] of Object.entries(concepts)) {
      console.log(`📊 Generating embedding for: ${key}`)

      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: description,
          encoding_format: 'float',
        })

        const vector = response.data[0].embedding

        // Assign numeric ID and store mapping
        conceptIds[key] = currentId

        // Add to points array for batch upsert
        points.push({
          id: currentId, // Use numeric ID instead of string
          vector: vector,
          payload: {
            concept: key,
            description: description,
            createdAt: new Date().toISOString(),
          },
        })

        console.log(
          `✅ Generated ${vector.length}-dimensional vector for ${key} (ID: ${currentId})`,
        )

        currentId++

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`❌ Error generating embedding for ${key}:`, error.message)
      }
    }

    // Upsert all points to Qdrant
    if (points.length > 0) {
      console.log(`📤 Upserting ${points.length} points to Qdrant...`)
      console.log(`First point structure:`, JSON.stringify(points[0], null, 2))

      try {
        await qdrant.upsert(collectionName, {
          wait: true,
          points: points,
        })
        console.log(`🎯 Successfully stored ${points.length} concept vectors in Qdrant`)
      } catch (upsertError) {
        console.error(`❌ Upsert failed:`, upsertError.message)
        console.error(`Error details:`, upsertError)

        // Try individual upserts to identify the problematic point
        console.log(`🔍 Trying individual upserts...`)
        for (let i = 0; i < points.length; i++) {
          try {
            await qdrant.upsert(collectionName, {
              wait: true,
              points: [points[i]],
            })
            console.log(`✅ Point ${i} (${points[i].id}) uploaded successfully`)
          } catch (individualError) {
            console.error(`❌ Point ${i} (${points[i].id}) failed:`, individualError.message)
          }
        }
      }
    }

    // Verify the collection
    const info = await qdrant.getCollection(collectionName)
    console.log(`📈 Collection info: ${info.points_count} points stored`)

    console.log('\n🎉 Concept embeddings generated and stored in Qdrant successfully!')
    console.log(`Collection: ${collectionName}`)
    console.log(`Concepts: ${points.map((p) => p.id).join(', ')}`)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Use import.meta.url for ES modules instead of require.main
if (import.meta.url === `file://${process.argv[1]}`) {
  generateConceptEmbeddings().catch(console.error)
}

export { generateConceptEmbeddings, concepts }
