'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MovieCard, CardGrid, type Movie } from '@/components/MovieCard'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface SearchResponse {
  success: boolean
  query: string
  results: Movie[]
  totalFound: number
  conceptWeights?: Record<string, number>
  conceptsEnabled?: boolean
  error?: string
  details?: string
}

interface ConceptSlider {
  id: string
  label: string
  leftLabel: string
  rightLabel: string
  value: number // -1 to 1, where 0 is neutral
  icon: string
}

const conceptSliders: ConceptSlider[] = [
  {
    id: 'adventure',
    label: 'Avontuur vs Rust',
    leftLabel: 'Rustig & Contemplatief',
    rightLabel: 'Avontuurlijk & Actie',
    value: 0,
    icon: '🏔️',
  },
  {
    id: 'romance',
    label: 'Romantiek',
    leftLabel: 'Weinig Romantiek',
    rightLabel: 'Veel Romantiek',
    value: 0,
    icon: '💕',
  },
  {
    id: 'complexity',
    label: 'Complexiteit',
    leftLabel: 'Eenvoudig & Luchtig',
    rightLabel: 'Complex & Diepgaand',
    value: 0,
    icon: '🧠',
  },
  {
    id: 'emotion',
    label: 'Emotionele Intensiteit',
    leftLabel: 'Licht & Ontspannen',
    rightLabel: 'Intens & Emotioneel',
    value: 0,
    icon: '🎭',
  },
  {
    id: 'realism',
    label: 'Realisme',
    leftLabel: 'Fantasy & Sci-Fi',
    rightLabel: 'Realistisch & Grounded',
    value: 0,
    icon: '🌟',
  },
]

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

  const handleFavoritesPage = () => {
    router.push('/favorites')
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
        body: JSON.stringify({
          query: query.trim(),
          limit: 10,
        }),
      })

      const data: SearchResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden bij het zoeken')
      }

      setResults(data.results || [])
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Er is een onbekende fout opgetreden')
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

      <div className="action-sections">
        <div className="explore-section">
          <button onClick={() => router.push('/explore')} className="explore-button">
            🎛️ Explore Films
          </button>
          <p className="section-description">Ontdek films met concept sliders, zonder zoekterm</p>
        </div>

        <div className="favorites-section">
          <button onClick={handleFavoritesPage} className="favorites-button">
            ❤️ Mijn Favorieten
          </button>
          <p className="section-description">Bekijk en beheer je favoriete films</p>
        </div>

        <div className="personal-recommendations-section">
          <button
            onClick={handlePersonalRecommendations}
            className="personal-recommendations-button"
          >
            ✨ Persoonlijke Aanbevelingen
          </button>
          <p className="section-description">
            Krijg gepersonaliseerde filmsuggties op basis van je favorieten
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      {/*
      {searchPerformed && !loading && !error && (
        <div className="results-summary">
          <p>
            {results.length === 0
              ? `Geen films gevonden voor "${query}"`
              : `${results.length} film${results.length !== 1 ? 's' : ''} gevonden voor "${query}"`}
          </p>
        </div>
      )} */}

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

        .advanced-search-section {
          margin-bottom: 2rem;
          text-align: center;
        }

        .advanced-toggle {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
        }

        .advanced-toggle:hover {
          background-color: #0056b3;
        }

        .concept-sliders-container {
          background-color: #f8f9fa;
          padding: 2rem;
          border-radius: 12px;
          margin-top: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .sliders-header {
          margin-bottom: 1.5rem;
        }

        .sliders-header h3 {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
          color: #333333;
        }

        .sliders-header p {
          font-size: 1rem;
          color: #666666;
        }

        .real-time-loading {
          color: #007bff;
          font-weight: 600;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .reset-button {
          padding: 0.5rem 1rem;
          font-size: 1rem;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 1rem;
        }

        .reset-button:hover {
          background-color: #c82333;
        }

        .sliders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .slider-container {
          background-color: #ffffff;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          border: 1px solid #e9ecef;
        }

        .slider-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .slider-icon {
          font-size: 1.2rem;
          margin-right: 0.25rem;
        }

        .slider-title {
          font-size: 0.95rem;
          color: #333333;
          margin: 0;
          flex: 1;
        }

        .slider-value {
          font-size: 0.85rem;
          color: #007bff;
          font-weight: 600;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .left-label,
        .right-label {
          font-size: 0.75rem;
          color: #666666;
          flex: 0 0 auto;
          text-align: center;
          max-width: 45%;
          line-height: 1.2;
        }

        .concept-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #007bff;
          outline: none;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .concept-slider:hover {
          opacity: 1;
        }

        .slider-markers {
          display: flex;
          justify-content: space-between;
          margin-top: 0.25rem;
        }

        .marker {
          font-size: 1rem;
          color: #007bff;
        }

        .marker.center {
          transform: translateY(-1px);
        }

        .concept-explanation {
          margin-top: 1.5rem;
          font-size: 0.9rem;
          color: #333333;
          background-color: #e9ecef;
          padding: 1rem;
          border-radius: 8px;
        }

        .action-sections {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .explore-section,
        .favorites-section,
        .personal-recommendations-section {
          text-align: center;
          padding: 2rem;
          border-radius: 12px;
          color: white;
        }

        .explore-section {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        }

        .favorites-section {
          background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
        }

        .personal-recommendations-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .explore-button,
        .favorites-button,
        .personal-recommendations-button {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          background-color: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .explore-button {
          color: #28a745;
        }

        .favorites-button {
          color: #dc3545;
        }

        .personal-recommendations-button {
          color: #667eea;
        }

        .explore-button:hover,
        .favorites-button:hover,
        .personal-recommendations-button:hover {
          background-color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .section-description {
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
          margin: 2rem 0;
          padding: 1.5rem;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .concept-weights-applied {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #e3f2fd;
          border-radius: 8px;
          border-left: 4px solid #2196f3;
        }

        .concept-weights-applied h4 {
          margin: 0 0 0.5rem 0;
          color: #1565c0;
          font-size: 1rem;
        }

        .applied-weights {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 0.5rem;
        }

        .weight-tag {
          padding: 0.3rem 0.8rem;
          border-radius: 15px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .weight-tag.positive {
          background-color: #4caf50;
          color: white;
        }

        .weight-tag.negative {
          background-color: #f44336;
          color: white;
        }

        .concept-warning {
          margin: 0.5rem 0 0 0;
          font-size: 0.85rem;
          color: #ff9800;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .search-container {
            padding: 1rem;
          }

          .search-header h1 {
            font-size: 2rem;
          }

          .action-sections {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .search-input-group {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
