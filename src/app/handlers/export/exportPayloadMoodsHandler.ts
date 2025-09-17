import { PayloadHandler } from 'payload'

const exportPayloadMoodsHandler: PayloadHandler = async (req) => {
  req.payload.logger.info('Starting moods export…')

  let page = 1
  const limit = 500
  const allDocs: any[] = []

  while (true) {
    const res = await req.payload.find({
      collection: 'moods',
      depth: 0,
      limit,
      page,
    })

    req.payload.logger.info(`Fetched page ${page}/${res.totalPages} (${res.docs.length} docs)`)
    allDocs.push(...res.docs)

    if (page >= res.totalPages) break
    page++
  }

  req.payload.logger.info(`Export complete. Total: ${allDocs.length} moods.`)

  return new Response(JSON.stringify(allDocs, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="moods.json"',
    },
  })
}

export default exportPayloadMoodsHandler
