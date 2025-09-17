// src/endpoints/export-qdrant-snapshot.ts
import type { PayloadHandler } from 'payload'
import { QdrantClient } from '@qdrant/js-client-rest'

const COLLECTION = 'movie-embeddings'
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env.QDRANT_API_KEY })

const exportQdrantSnapshot: PayloadHandler = async (req) => {
  const log = req.payload.logger
  try {
    log.info(`[snapshot] Creating snapshot for "${COLLECTION}"…`)
    await qdrant.createSnapshot(COLLECTION)

    log.info(`[snapshot] Listing snapshots…`)
    const snapshots = await qdrant.listSnapshots(COLLECTION)

    if (!snapshots?.length) {
      throw new Error('No snapshots found after creation')
    }

    const latest = [...snapshots].sort((a, b) => {
      const ta = a.creation_time ? Date.parse(a.creation_time) : 0
      const tb = b.creation_time ? Date.parse(b.creation_time) : 0
      return tb - ta
    })[0]

    log.info(`[snapshot] Selected snapshot: ${latest.name}`)

    const url = `${process.env.QDRANT_URL!.replace(/\/$/, '')}/collections/${COLLECTION}/snapshots/${latest.name}`
    const res = await fetch(url, {
      headers: process.env.QDRANT_API_KEY ? { 'api-key': process.env.QDRANT_API_KEY } : {},
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Download failed: ${res.status} ${res.statusText} – ${text}`)
    }

    const filename = `${COLLECTION}-${latest.name}`.replace(/[/\\]+/g, '_')
    log.info(`[snapshot] Streaming snapshot to client: ${filename}`)

    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    const msg = err?.message || String(err)
    req.payload.logger.error(`[snapshot] Failed: ${msg}`)
    return new Response(JSON.stringify({ error: msg }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export default exportQdrantSnapshot
