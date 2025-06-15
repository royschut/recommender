'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MovieCard, CardGrid, type Movie } from '@/components/MovieCard'

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
  const router = useRouter()

  const handleMovieClick = (movieId: string) => {
    router.push(`/movie/${movieId}`)
  }

  const handlePersonalRecommendations = () => {
    router.push('/personal')
  }

  const handleFavoriteChange = () => {
    // No special handling needed on search page
  }

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

      <div className="personal-recommendations-section">
        <button
          onClick={handlePersonalRecommendations}
          className="personal-recommendations-button"
        >
          ✨ Persoonlijke Aanbevelingen
        </button>
        <p className="personal-recommendations-description">
          Krijg gepersonaliseerde filmsuggges op basis van je favorieten
        </p>
      </div>

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
        <CardGrid>
          {results.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              onClick={handleMovieClick}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </CardGrid>
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

        .personal-recommendations-section {
          text-align: center;
          margin-bottom: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }

        .personal-recommendations-button {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          background-color: rgba(255, 255, 255, 0.9);
          color: #667eea;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .personal-recommendations-button:hover:not(:disabled) {
          background-color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .personal-recommendations-button:disabled {
          background-color: rgba(255, 255, 255, 0.6);
          cursor: not-allowed;
          transform: none;
        }

        .personal-recommendations-description {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
          margin: 0;
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
        }
      `}</style>
    </div>
  )
}
