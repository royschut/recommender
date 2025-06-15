import type { CollectionConfig } from 'payload'

export const Movies: CollectionConfig = {
  slug: 'movies',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'tmdbId',
      type: 'number',
      required: true,
      unique: true,
      admin: {
        description: 'The Movie Database ID',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'originalTitle',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.originalTitle !== siblingData.title,
      },
    },
    {
      name: 'overview',
      type: 'textarea',
    },
    {
      name: 'releaseDate',
      type: 'date',
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Downloaded poster image',
      },
    },
    {
      name: 'adult',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'genres',
      type: 'array',
      fields: [
        {
          name: 'genre',
          type: 'text',
        },
      ],
    },
    {
      name: 'originalLanguage',
      type: 'text',
    },
    {
      name: 'popularity',
      type: 'number',
    },
    {
      name: 'voteAverage',
      type: 'number',
    },
    {
      name: 'voteCount',
      type: 'number',
    },
    {
      name: 'video',
      type: 'checkbox',
      defaultValue: false,
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
        description: 'Whether this movie has an embedding in Qdrant',
        readOnly: true,
      },
      defaultValue: false,
    },
  ],
}
