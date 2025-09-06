import type { CollectionConfig } from 'payload'
import {
  createMoodEmbedding,
  updateMoodEmbedding,
  deleteMoodEmbedding,
  ensureConceptVectorsCollection,
} from '../utils/moodEmbeddings'

export const Moods: CollectionConfig = {
  slug: 'moods',
  admin: {
    useAsTitle: 'description',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      async () => {
        await ensureConceptVectorsCollection()
      },
    ],
    afterChange: [
      async ({ req, doc, operation, previousDoc }) => {
        if (operation === 'create') {
          const qdrantId = await createMoodEmbedding(doc.id, doc.description)
          await req.payload.update({
            collection: 'moods',
            id: doc.id,
            data: { qdrantId, hasEmbedding: true },
          })
        } else if (operation === 'update' && previousDoc?.description !== doc.description) {
          await updateMoodEmbedding(doc.id, doc.description)
          if (!doc.hasEmbedding) {
            await req.payload.update({
              collection: 'moods',
              id: doc.id,
              data: { hasEmbedding: true },
            })
          }
        }
      },
    ],
    beforeDelete: [
      async ({ id }) => {
        await deleteMoodEmbedding(String(id))
      },
    ],
  },
  fields: [
    {
      name: 'description',
      type: 'text',
      required: true,
      admin: {
        description: 'Description of the mood/concept',
      },
    },
    {
      name: 'qdrantId',
      type: 'text',
      admin: {
        description: 'Qdrant vector ID for similarity search',
        readOnly: true,
      },
    },
    {
      name: 'hasEmbedding',
      type: 'checkbox',
      admin: {
        description: 'Whether this mood has an embedding in Qdrant',
        readOnly: true,
      },
      defaultValue: false,
    },
  ],
}
