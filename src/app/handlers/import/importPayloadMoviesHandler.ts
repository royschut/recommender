import type { PayloadHandler } from 'payload'
import fs from 'node:fs/promises'
import path from 'node:path'

const importPayloadMoviesHandler: PayloadHandler = async (req) => {
  const filePath = path.resolve(process.cwd(), 'data/movies.json')

  req.payload.logger.info('Starting movies import…')

  // 1) Read file
  const raw = await fs.readFile(filePath, 'utf-8')
  const items = JSON.parse(raw) as any[]

  if (!Array.isArray(items)) {
    return new Response('movies.json must be a JSON array', { status: 400 })
  }

  // 2) Empty collection
  req.payload.logger.info('Clearing existing movies…')
  await req.payload.delete({
    collection: 'movies',
    where: {
      id: { exists: true },
    },
  })

  // 3) Write items
  req.payload.logger.info(`Importing ${items.length} movies…`)
  let created = 0

  for (const item of items) {
    const { id, createdAt, updatedAt, _status, ...data } = item
    await req.payload.create({
      collection: 'movies',
      data,
    })
    created++
  }

  req.payload.logger.info(`Import complete. Created: ${created} movies.`)

  return new Response(JSON.stringify({ ok: true, created }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export default importPayloadMoviesHandler
