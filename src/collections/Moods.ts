import type { CollectionConfig } from 'payload'
import {
  createMoodEmbedding,
  updateMoodEmbedding,
  deleteMoodEmbedding,
  deleteAllMoodEmbeddings,
  ensureMovieEmbeddingsCollection,
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
        await ensureMovieEmbeddingsCollection()
      },
    ],
    afterChange: [
      async ({ req, doc, operation, previousDoc }) => {
        if (operation === 'create') {
          const qdrantId = await createMoodEmbedding(doc.id, doc.title, doc.description)
          await req.payload.update({
            collection: 'moods',
            id: doc.id,
            data: { qdrantId, hasEmbedding: true },
          })
        } else if (
          operation === 'update' &&
          (previousDoc?.description !== doc.description || previousDoc?.title !== doc.title)
        ) {
          await updateMoodEmbedding(doc.id, doc.title, doc.description)
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
  endpoints: [
    {
      path: '/recreate-embedding/:id',
      method: 'post',
      handler: async (req) => {
        try {
          const id = req.routeParams?.id as string
          const mood = await req.payload.findByID({ collection: 'moods', id })

          const qdrantId = await updateMoodEmbedding(String(mood.id), mood.title, mood.description)
          await req.payload.update({
            collection: 'moods',
            id: mood.id,
            data: { qdrantId, hasEmbedding: true },
          })

          return Response.json({ success: true, qdrantId })
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      },
    },
    {
      path: '/delete-all-embeddings',
      method: 'post',
      handler: async (req) => {
        try {
          const deletedCount = await deleteAllMoodEmbeddings()

          // Update all mood documents to reflect they no longer have embeddings
          await req.payload.update({
            collection: 'moods',
            where: {},
            data: { hasEmbedding: false, qdrantId: '' },
          })

          return Response.json({
            success: true,
            message: `Deleted ${deletedCount} mood embeddings`,
            deletedCount,
          })
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      },
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Short title, preferably one word (e.g., "Happy", "Romantic")',
      },
    },
    {
      name: 'description',
      type: 'text',
      required: true,
      admin: {
        description: 'Description of the mood, concept or feeling',
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
    {
      name: 'recreateEmbedding',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/RecreateEmbeddingButton#RecreateEmbeddingButton',
        },
      },
    },
  ],
}
