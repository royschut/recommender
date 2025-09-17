// src/endpoints/import-qdrant-snapshot.ts
import type { PayloadHandler } from 'payload'

/**
 * Imports a Qdrant TAR snapshot into the target collection by streaming
 * the request body to Qdrant's /snapshots/upload?wait=true endpoint.
 *
 * Usage:
 *   curl -X POST http://localhost:3000/api/import/qdrant \
 *        -H "Content-Type: application/octet-stream" \
 *        --data-binary @data/movie-embeddings.snapshot
 *
 * Matches your exporter style: uses QDRANT_URL/API_KEY env like the exporter.
 */
const COLLECTION = 'movie-embeddings'
const QDRANT_URL = (process.env.QDRANT_URL || '').replace(/\/$/, '')

const importQdrantSnapshot: PayloadHandler = async (req) => {
  const log = req.payload.logger

  try {
    if (!QDRANT_URL) {
      return new Response('QDRANT_URL is required', { status: 500 })
    }

    // Read raw body once (we’ll wrap it into FormData)
    if (typeof req.arrayBuffer !== 'function') {
      return new Response('Request does not support arrayBuffer()', { status: 400 })
    }
    const buf = new Uint8Array(await req.arrayBuffer())
    if (!buf.length) {
      return new Response('Empty body: POST the snapshot file as binary', { status: 400 })
    }

    // Build multipart/form-data with the snapshot (Qdrant expects "snapshot" field)
    const form = new FormData()
    form.append(
      'snapshot',
      new Blob([buf], { type: 'application/octet-stream' }),
      'snapshot.tar', // filename is arbitrary
    )

    const headers: Record<string, string> = {}
    if (process.env.QDRANT_API_KEY) headers['api-key'] = process.env.QDRANT_API_KEY

    const url = `${QDRANT_URL}/collections/${encodeURIComponent(COLLECTION)}/snapshots/upload?wait=true`
    log.info(`[snapshot] Uploading to ${url}…`)

    const res = await fetch(url, { method: 'POST', headers, body: form })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Qdrant upload failed: ${res.status} ${res.statusText} – ${text}`)
    }

    const out = await res.json().catch(() => ({}))
    log.info(`[snapshot] Import OK for "${COLLECTION}"`)

    return new Response(
      JSON.stringify({ ok: true, collection: COLLECTION, qdrant: out }, null, 2),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    const msg = err?.message || String(err)
    log.error(`[snapshot] Failed: ${msg}`)
    return new Response(JSON.stringify({ error: msg }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export default importQdrantSnapshot
