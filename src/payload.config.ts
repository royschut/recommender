// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Movies } from './collections/Movies'
import { Favorites } from './collections/Favorites'
import { Moods } from './collections/Moods'
import importsHandler from './app/handlers/importsHandler'
import embeddingsHandler from './app/handlers/embeddingsHandler'
import conceptVectorsHandler from './app/handlers/conceptVectorsHandler'
import exportPayloadMoviesHandler from './app/handlers/import/importPayloadMoviesHandler'
import exportPayloadMoodsHandler from './app/handlers/import/importPayloadMoodsHandler'
import exportQdrantHandler from './app/handlers/import/importQdrantHandler'
import importPayloadMoodsHandler from './app/handlers/import/importPayloadMoodsHandler'
import importQdrantHandler from './app/handlers/import/importQdrantHandler'
import importPayloadMoviesHandler from './app/handlers/import/importPayloadMoviesHandler'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  endpoints: [
    {
      path: '/imports',
      method: 'get',
      handler: importsHandler,
    },
    {
      path: '/embeddings',
      method: 'get',
      handler: embeddingsHandler,
    },
    {
      path: '/concept-vectors',
      method: 'get',
      handler: conceptVectorsHandler,
    },
    {
      path: '/export/payload-movies',
      method: 'get',
      handler: exportPayloadMoviesHandler,
    },
    {
      path: '/export/payload-moods',
      method: 'get',
      handler: exportPayloadMoodsHandler,
    },
    {
      path: '/export/qdrant',
      method: 'get',
      handler: exportQdrantHandler,
    },
    {
      path: '/import/payload-movies',
      method: 'get',
      handler: importPayloadMoviesHandler,
    },
    {
      path: '/import/payload-moods',
      method: 'get',
      handler: importPayloadMoodsHandler,
    },
    {
      path: '/import/qdrant',
      method: 'post',
      handler: importQdrantHandler,
    },
  ],
  collections: [Users, Media, Movies, Favorites, Moods],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
