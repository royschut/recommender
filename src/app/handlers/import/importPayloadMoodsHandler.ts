import type { PayloadHandler } from 'payload'
import fs from 'node:fs/promises'
import path from 'node:path'

const importPayloadMoodsHandler: PayloadHandler = async (req) => {
  const filePath = path.resolve(process.cwd(), 'data/moods.json')

  req.payload.logger.info('Starting moods import…')

  // 1) Read file
  const raw = await fs.readFile(filePath, 'utf-8')
  const items = JSON.parse(raw) as any[]

  if (!Array.isArray(items)) {
    return new Response('moods.json must be a JSON array', { status: 400 })
  }

  // 2) Empty collection
  req.payload.logger.info('Clearing existing moods…')
  await req.payload.delete({
    collection: 'moods',
    where: {
      id: { exists: true }, // remove all
    },
  })

  // 3) Write items
  req.payload.logger.info(`Importing ${items.length} moods…`)
  let created = 0

  for (const item of items) {
    // strip system fields; Payload determines id/createdAt/updatedAt itself
    const { id, createdAt, updatedAt, _status, ...data } = item
    await req.payload.create({
      collection: 'moods',
      data,
    })
    created++
  }

  req.payload.logger.info(`Import complete. Created: ${created} moods.`)

  return new Response(JSON.stringify({ ok: true, created }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export default importPayloadMoodsHandler
