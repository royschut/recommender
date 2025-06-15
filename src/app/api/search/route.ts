import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a non-empty string' },
        { status: 400 },
      )
    }

    // Initialize OpenAI and Qdrant clients
    const openai = new OpenAI({
      apiKey: process.env.OPEN_AI_API_KEY,
    })

    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    })

    const collectionName = 'movie-embeddings'

    // Create embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.trim(),
      encoding_format: 'float',
    })

    const queryVector = embeddingResponse.data[0].embedding

    // Search for similar vectors in Qdrant
    const searchResults = await qdrant.search(collectionName, {
      vector: queryVector,
      limit: 10,
      with_payload: true,
    })

    // Get movie IDs from search results
    const movieIds = searchResults.map((result) => result.payload?.movieId).filter(Boolean)

    if (movieIds.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No movies found matching your search query',
      })
    }

    // Fetch full movie details from Payload
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const movies = await payload.find({
      collection: 'movies',
      where: {
        id: {
          in: movieIds,
        },
      },
      limit: movieIds.length,
    })

    // Sort movies by their similarity score (maintaining order from Qdrant)
    const sortedMovies = movieIds
      .map((movieId) => {
        const movie = movies.docs.find((m) => String(m.id) === movieId)
        const searchResult = searchResults.find((r) => r.payload?.movieId === movieId)
        return {
          ...movie,
          similarityScore: searchResult?.score || 0,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      query,
      results: sortedMovies,
      totalFound: sortedMovies.length,
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform search',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
