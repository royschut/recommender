import type { CollectionConfig } from 'payload'

export const Moods: CollectionConfig = {
  slug: 'moods',
  admin: {
    useAsTitle: 'description',
  },
  access: {
    read: () => true,
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
