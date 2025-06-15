import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const { movieId } = await request.json()

    if (!movieId || typeof movieId !== 'string') {
      return NextResponse.json(
        { error: 'Movie ID is required and must be a string' },
        { status: 400 },
      )
    }

    // Initialize Payload
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Check if movie exists
    const movie = await payload.findByID({
      collection: 'movies',
      id: movieId,
    })

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    // Check if already favorited
    const existingFavorite = await payload.find({
      collection: 'favorites',
      where: {
        movie: {
          equals: movieId,
        },
      },
    })

    if (existingFavorite.docs.length > 0) {
      return NextResponse.json({ error: 'Movie is already in favorites' }, { status: 409 })
    }

    // Add to favorites
    const favorite = await payload.create({
      collection: 'favorites',
      data: {
        movie: movieId,
      },
    })

    return NextResponse.json({
      success: true,
      favorite,
      message: 'Movie added to favorites',
    })
  } catch (error: any) {
    console.error('Add favorite error:', error)
    return NextResponse.json(
      {
        error: 'Failed to add favorite',
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { movieId } = await request.json()

    if (!movieId || typeof movieId !== 'string') {
      return NextResponse.json(
        { error: 'Movie ID is required and must be a string' },
        { status: 400 },
      )
    }

    // Initialize Payload
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find the favorite
    const favorite = await payload.find({
      collection: 'favorites',
      where: {
        movie: {
          equals: movieId,
        },
      },
    })

    if (favorite.docs.length === 0) {
      return NextResponse.json({ error: 'Movie not found in favorites' }, { status: 404 })
    }

    // Remove from favorites
    await payload.delete({
      collection: 'favorites',
      id: favorite.docs[0].id,
    })

    return NextResponse.json({
      success: true,
      message: 'Movie removed from favorites',
    })
  } catch (error: any) {
    console.error('Remove favorite error:', error)
    return NextResponse.json(
      {
        error: 'Failed to remove favorite',
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Initialize Payload
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get all favorites with movie details
    const favorites = await payload.find({
      collection: 'favorites',
      depth: 1, // This will populate the relationship fields
      sort: '-addedAt',
    })

    return NextResponse.json({
      success: true,
      favorites: favorites.docs,
      total: favorites.totalDocs,
    })
  } catch (error: any) {
    console.error('Get favorites error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get favorites',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
