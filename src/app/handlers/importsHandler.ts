import { Payload, PayloadHandler } from 'payload'

interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  release_date: string
  poster_path: string | null
  backdrop_path: string | null
  adult: boolean
  genre_ids: number[]
  original_language: string
  popularity: number
  vote_average: number
  vote_count: number
  video: boolean
}

interface TMDBResponse {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

const importsHandler: PayloadHandler = async (req) => {
  try {
    const apiKey = process.env.MOVIE_DB_API_KEY

    if (!apiKey) {
      return Response.json(
        { error: 'MOVIE_DB_API_KEY environment variable is required' },
        { status: 400 },
      )
    }

    const { payload, searchParams } = req

    // Get the number of pages to import from query parameters (default: 10)
    const pagesToImport = parseInt(searchParams.get('pages') || '10', 10)

    // Validate pages parameter
    if (isNaN(pagesToImport) || pagesToImport < 1 || pagesToImport > 500) {
      return Response.json(
        { error: 'Pages parameter must be a number between 1 and 500' },
        { status: 400 },
      )
    }
    let totalImported = 0
    const errors: string[] = []

    // First, fetch the genre list from TMDB
    let genreMap: Record<number, string> = {}
    try {
      const genreUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`
      const genreResponse = await fetch(genreUrl)

      if (genreResponse.ok) {
        const genreData = await genreResponse.json()
        genreMap = genreData.genres.reduce(
          (map: Record<number, string>, genre: { id: number; name: string }) => {
            map[genre.id] = genre.name
            return map
          },
          {},
        )
        console.log(`Loaded ${Object.keys(genreMap).length} genres`)
      }
    } catch (genreError) {
      errors.push(`Error fetching genres: ${genreError}`)
    }

    console.log('Clearing existing movies...')
    try {
      // Use direct MongoDB operation for fast clearing
      const result = await payload.db.collections.movies.deleteMany({})
      console.log(`Cleared ${result.deletedCount} existing movies (optimized)`)
    } catch (clearError: any) {
      // Fallback to Payload delete if direct access fails
      try {
        const deleteResult = await payload.delete({
          collection: 'movies',
          where: {},
        })
        console.log(`Cleared ${deleteResult.docs.length} existing movies (fallback)`)
      } catch (fallbackError) {
        errors.push(`Error clearing existing movies: ${fallbackError}`)
      }
    }

    console.log(`Starting import of ${pagesToImport} pages from TMDB...`)

    const PARALLEL_BATCH_SIZE = 5 // Fetch 5 pages simultaneously

    for (let i = 0; i < pagesToImport; i += PARALLEL_BATCH_SIZE) {
      const endPage = Math.min(i + PARALLEL_BATCH_SIZE, pagesToImport)
      const currentBatch = Array.from({ length: endPage - i }, (_, index) => i + index + 1)

      console.log(
        `Fetching pages ${currentBatch[0]}-${currentBatch[currentBatch.length - 1]} of ${pagesToImport}...`,
      )

      // Fetch multiple pages in parallel
      const pagePromises = currentBatch.map(async (page) => {
        try {
          const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${page}`
          const response = await fetch(url)

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data: TMDBResponse = await response.json()
          return { page, data, success: true }
        } catch (error: any) {
          return { page, error: error.message, success: false }
        }
      })

      // Wait for all pages in this batch to complete
      const batchResults = await Promise.all(pagePromises)

      // Process each successful page result
      for (const result of batchResults) {
        if (!result.success) {
          errors.push(`Error fetching page ${result.page}: ${result.error}`)
          continue
        }

        try {
          const moviesToInsert = result.data?.results.map((movie) => {
            const posterUrl = movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : null

            return {
              tmdbId: movie.id,
              title: movie.title,
              originalTitle:
                movie.original_title !== movie.title ? movie.original_title : undefined,
              overview: movie.overview || undefined,
              releaseDate: movie.release_date || undefined,
              posterUrl: posterUrl,
              adult: movie.adult,
              genres: movie.genre_ids
                .map((id) => genreMap[id])
                .filter(Boolean)
                .map((genre) => ({ genre })),
              originalLanguage: movie.original_language,
              popularity: movie.popularity,
              voteAverage: movie.vote_average,
              voteCount: movie.vote_count,
              video: movie.video,
            }
          })

          if (moviesToInsert && moviesToInsert.length > 0) {
            const insertPromises = moviesToInsert.map((movieData) =>
              payload.create({
                collection: 'movies',
                data: movieData,
              }),
            )

            await Promise.all(insertPromises)
            totalImported += moviesToInsert.length
            console.log(`  Page ${result.page}: inserted ${moviesToInsert.length} movies`)
          }
        } catch (batchError: any) {
          errors.push(`Error batch inserting page ${result.page}: ${batchError.message}`)
        }
      }

      // Small delay between parallel batches to be respectful to the API
      if (endPage < pagesToImport) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    return Response.json(
      {
        success: true,
        message: `Import completed. ${totalImported} movies imported from ${pagesToImport} pages.`,
        totalImported,
        pagesImported: pagesToImport,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 },
    )
  } catch (error) {
    return Response.json({ error: `Import failed: ${error}` }, { status: 500 })
  }
}

export default importsHandler
