'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface Movie {
  id: string
  title: string
  originalTitle?: string
  overview?: string
  releaseDate?: string
  posterUrl?: string
  genres?: Array<{ genre: string }>
  voteAverage?: number
  similarityScore?: number
}

interface SearchResponse {
  success: boolean
  query: string
  results: Movie[]
  totalFound: number
  error?: string
  details?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchPerformed, setSearchPerformed] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) {
      setError('Voer een zoekterm in')
      return
    }

    setLoading(true)
    setError(null)
    setSearchPerformed(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      })

      const data: SearchResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden bij het zoeken')
      }

      setResults(data.results || [])
    } catch (err: any) {
      setError(err.message || 'Er is een onbekende fout opgetreden')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const formatScore = (score?: number) => {
    return score ? (score * 100).toFixed(1) + '%' : 'N/A'
  }

  const formatGenres = (genres?: Array<{ genre: string }>) => {
    return genres?.map((g) => g.genre).join(', ') || 'Geen genres'
  }

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>Film Zoeken met AI</h1>
        <p>Zoek naar films op basis van beschrijvingen, genres, of wat je maar wilt!</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bijv. 'een spannende sci-fi film over ruimte' of 'romantische komedie'"
            className="search-input"
            disabled={loading}
          />
          <button type="submit" className="search-button" disabled={loading || !query.trim()}>
            {loading ? 'Zoeken...' : 'Zoeken'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {searchPerformed && !loading && !error && (
        <div className="results-summary">
          <p>
            {results.length === 0
              ? `Geen films gevonden voor "${query}"`
              : `${results.length} film${results.length !== 1 ? 's' : ''} gevonden voor "${query}"`}
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="results-grid">
          {results.map((movie) => (
            <div key={movie.id} className="movie-card">
              <div className="movie-poster">
                {movie.posterUrl ? (
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    width={200}
                    height={300}
                    className="poster-image"
                  />
                ) : (
                  <div className="poster-placeholder">
                    <span>Geen poster</span>
                  </div>
                )}
              </div>

              <div className="movie-info">
                <h3 className="movie-title">{movie.title}</h3>
                {movie.originalTitle && movie.originalTitle !== movie.title && (
                  <p className="original-title">({movie.originalTitle})</p>
                )}

                <div className="movie-meta">
                  <span className="similarity-score">
                    Match: {formatScore(movie.similarityScore)}
                  </span>
                  {movie.voteAverage && (
                    <span className="rating">⭐ {movie.voteAverage.toFixed(1)}/10</span>
                  )}
                  {movie.releaseDate && (
                    <span className="release-date">
                      {new Date(movie.releaseDate).getFullYear()}
                    </span>
                  )}
                </div>

                <p className="movie-genres">{formatGenres(movie.genres)}</p>

                {movie.overview && <p className="movie-overview">{movie.overview}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .search-container {
          min-height: 100vh;
          background-color: #ffffff;
          color: #333333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .search-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .search-header h1 {
          font-size: 2.5rem;
          color: #222222;
          margin-bottom: 0.5rem;
        }

        .search-header p {
          font-size: 1.1rem;
          color: #555555;
        }

        .search-form {
          margin-bottom: 2rem;
        }

        .search-input-group {
          display: flex;
          gap: 1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .search-input {
          flex: 1;
          padding: 1rem;
          font-size: 1rem;
          border: 2px solid #ddd;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.2s;
          background-color: #ffffff;
          color: #333333;
        }

        .search-input:focus {
          border-color: #007bff;
        }

        .search-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .search-button {
          padding: 1rem 2rem;
          font-size: 1rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .search-button:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .search-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          text-align: center;
          margin: 1rem 0;
        }

        .error-message p {
          color: #dc3545;
          font-weight: 500;
          padding: 1rem;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          display: inline-block;
        }

        .results-summary {
          text-align: center;
          margin: 1rem 0 2rem 0;
          font-size: 1.1rem;
          color: #555555;
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .movie-card {
          border: 1px solid #ddd;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          color: #333333;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition:
            transform 0.2s,
            box-shadow 0.2s;
        }

        .movie-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .movie-poster {
          width: 100%;
          align-items: center;
          justify-content: center;
          display: flex;
          position: relative;
          background-color: #f5f5f5;
        }

        .poster-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .poster-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f0f0f0;
          color: #999;
          font-size: 0.9rem;
        }

        .movie-info {
          padding: 1.5rem;
        }

        .movie-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #222222;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .original-title {
          font-size: 0.9rem;
          color: #555555;
          font-style: italic;
          margin-bottom: 1rem;
        }

        .movie-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .similarity-score {
          background-color: #e7f3ff;
          color: #0066cc;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .rating {
          color: #ff9500;
          font-weight: 500;
        }

        .release-date {
          color: #555555;
        }

        .movie-genres {
          font-size: 0.9rem;
          color: #007bff;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .movie-overview {
          font-size: 0.7rem;
          color: #444444;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .search-container {
            padding: 1rem;
          }

          .search-header h1 {
            font-size: 2rem;
          }

          .search-input-group {
            flex-direction: column;
          }

          .results-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
