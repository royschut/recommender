import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get all movies with their genres
    const movies = await payload.find({
      collection: 'movies',
      limit: 0, // Get all movies
      select: {
        genres: true,
      },
    })

    // Extract unique genres
    const genreSet = new Set<string>()

    movies.docs.forEach((movie: any) => {
      if (movie.genres && Array.isArray(movie.genres)) {
        movie.genres.forEach((genreObj: any) => {
          if (genreObj.genre && typeof genreObj.genre === 'string') {
            genreSet.add(genreObj.genre)
          }
        })
      }
    })

    // Convert to sorted array
    const genres = Array.from(genreSet).sort()

    console.log(`📊 Found ${genres.length} unique genres in database`)

    return NextResponse.json({
      success: true,
      genres,
      total: genres.length,
    })
  } catch (error: any) {
    console.error('❌ Genres API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Er is een fout opgetreden bij het ophalen van genres',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
