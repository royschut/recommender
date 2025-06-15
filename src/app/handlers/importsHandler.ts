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

    // Clear existing movies first
    try {
      const deleteResult = await payload.delete({
        collection: 'movies',
        where: {}, // Empty where clause deletes all records
      })

      console.log(`Cleared ${deleteResult.docs.length} existing movies`)
    } catch (clearError) {
      errors.push(`Error clearing existing movies: ${clearError}`)
    }

    console.log(`Starting import of ${pagesToImport} pages from TMDB...`)

    // Helper function to download and save an image
    const downloadAndSaveImage = async (
      imagePath: string,
      movieTitle: string,
      type: 'poster' | 'backdrop',
    ) => {
      try {
        const imageUrl = `https://image.tmdb.org/t/p/w500${imagePath}`
        const response = await fetch(imageUrl)

        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Create a safe filename
        const safeTitle = movieTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        const extension = imagePath.split('.').pop() || 'jpg'
        const filename = `${safeTitle}_${type}.${extension}`

        // Save to media collection
        const mediaDoc = await payload.create({
          collection: 'media',
          data: {
            alt: `${movieTitle} ${type}`,
          },
          file: {
            data: buffer,
            mimetype: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
            name: filename,
            size: buffer.length,
          },
        })

        return mediaDoc.id
      } catch (error) {
        console.error(`Error downloading ${type} for ${movieTitle}:`, error)
        return null
      }
    }

    // Fetch specified number of pages
    for (let page = 1; page <= pagesToImport; page++) {
      try {
        console.log(`Fetching page ${page} of ${pagesToImport}...`)
        const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${page}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: TMDBResponse = await response.json()

        // Process each movie
        for (const movie of data.results) {
          try {
            // Download images if they exist
            let posterId = null

            if (movie.poster_path) {
              posterId = await downloadAndSaveImage(movie.poster_path, movie.title, 'poster')
              await new Promise((resolve) => setTimeout(resolve, 200)) // Small delay between image downloads
            }

            // Create new movie
            await payload.create({
              collection: 'movies',
              data: {
                tmdbId: movie.id,
                title: movie.title,
                originalTitle:
                  movie.original_title !== movie.title ? movie.original_title : undefined,
                overview: movie.overview || undefined,
                releaseDate: movie.release_date || undefined,
                poster: posterId || undefined,
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
              },
            })
            totalImported++
          } catch (movieError) {
            errors.push(`Error processing movie ${movie.title}: ${movieError}`)
          }
        }

        // Add a small delay between requests to be respectful to the API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (pageError) {
        errors.push(`Error fetching page ${page}: ${pageError}`)
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
