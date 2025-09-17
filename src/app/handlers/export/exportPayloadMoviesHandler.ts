import { PayloadHandler } from 'payload'

const exportPayloadMoviesHandler: PayloadHandler = async (req) => {
  req.payload.logger.info('Starting movies export…')

  let page = 1
  const limit = 10000
  const allDocs: any[] = []

  while (true) {
    const res = await req.payload.find({
      collection: 'movies',
      depth: 0,
      limit,
      page,
    })

    req.payload.logger.info(`Fetched page ${page}/${res.totalPages} (${res.docs.length} docs)`)
    allDocs.push(...res.docs)

    if (page >= res.totalPages) break
    page++
  }

  req.payload.logger.info(`Export complete. Total: ${allDocs.length} movies.`)

  return new Response(JSON.stringify(allDocs, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="movies.json"',
    },
  })
}

export default exportPayloadMoviesHandler
