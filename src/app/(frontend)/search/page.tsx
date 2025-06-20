'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MovieCard, CardGrid, type Movie } from '@/components/MovieCard'

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
  const [sliders, setSliders] = useState<ConceptSlider[]>(conceptSliders)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastSearchInfo, setLastSearchInfo] = useState<{
    conceptWeights?: Record<string, number>
    conceptsEnabled?: boolean
  }>({})
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

  const handleSliderChange = (sliderId: string, value: number) => {
    setSliders((prev) =>
      prev.map((slider) => (slider.id === sliderId ? { ...slider, value } : slider)),
    )
  }

  const resetSliders = () => {
    setSliders((prev) => prev.map((slider) => ({ ...slider, value: 0 })))
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
      // Prepare concept weights for the API
      const conceptWeights = sliders.reduce(
        (acc, slider) => {
          acc[slider.id] = slider.value
          return acc
        },
        {} as Record<string, number>,
      )

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          conceptWeights,
        }),
      })

      const data: SearchResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden bij het zoeken')
      }

      setResults(data.results || [])
      setLastSearchInfo({
        conceptWeights: data.conceptWeights,
        conceptsEnabled: data.conceptsEnabled,
      })
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

      {/* Advanced Search Controls */}
      <div className="advanced-search-section">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="advanced-toggle"
          type="button"
        >
          {showAdvanced ? '🔽' : '▶️'} Geavanceerd Zoeken met Concept Sliders
        </button>

        {showAdvanced && (
          <div className="concept-sliders-container">
            <div className="sliders-header">
              <h3>🎛️ Film Dimensies</h3>
              <p>
                Balanceer tussen verschillende film eigenschappen om je zoekresultaten te verfijnen
              </p>
              <button onClick={resetSliders} className="reset-button" type="button">
                Reset alle sliders
              </button>
            </div>

            <div className="sliders-grid">
              {sliders.map((slider) => (
                <div key={slider.id} className="slider-container">
                  <div className="slider-header">
                    <span className="slider-icon">{slider.icon}</span>
                    <h4 className="slider-title">{slider.label}</h4>
                    <span className="slider-value">
                      {slider.value === 0
                        ? 'Neutraal'
                        : slider.value > 0
                          ? `+${(slider.value * 100).toFixed(0)}%`
                          : `${(slider.value * 100).toFixed(0)}%`}
                    </span>
                  </div>

                  <div className="slider-labels">
                    <span className="left-label">{slider.leftLabel}</span>
                    <span className="right-label">{slider.rightLabel}</span>
                  </div>

                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={slider.value}
                    onChange={(e) => handleSliderChange(slider.id, parseFloat(e.target.value))}
                    className="concept-slider"
                    disabled={loading}
                  />

                  <div className="slider-markers">
                    <span className="marker left">←</span>
                    <span className="marker center">●</span>
                    <span className="marker right">→</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="concept-explanation">
              <p>
                💡 <strong>Tip:</strong> Sleep de sliders om films te vinden die meer naar een
                bepaalde eigenschap neigen. Neutrale sliders hebben geen effect op de
                zoekresultaten.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="action-sections">
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

      {searchPerformed && !loading && !error && (
        <div className="results-summary">
          <p>
            {results.length === 0
              ? `Geen films gevonden voor "${query}"`
              : `${results.length} film${results.length !== 1 ? 's' : ''} gevonden voor "${query}"`}
          </p>

          {lastSearchInfo.conceptWeights &&
            Object.values(lastSearchInfo.conceptWeights).some((w) => w !== 0) && (
              <div className="concept-weights-applied">
                <h4>🎛️ Toegepaste Concept Filters:</h4>
                <div className="applied-weights">
                  {Object.entries(lastSearchInfo.conceptWeights)
                    .filter(([_, weight]) => weight !== 0)
                    .map(([concept, weight]) => {
                      const slider = sliders.find((s) => s.id === concept)
                      if (!slider) return null

                      const percentage = (weight * 100).toFixed(0)
                      const isPositive = weight > 0

                      return (
                        <span
                          key={concept}
                          className={`weight-tag ${isPositive ? 'positive' : 'negative'}`}
                        >
                          {slider.icon} {slider.label}: {isPositive ? '+' : ''}
                          {percentage}%
                        </span>
                      )
                    })}
                </div>
                {!lastSearchInfo.conceptsEnabled && (
                  <p className="concept-warning">
                    ⚠️ Concept filters zijn nog niet actief. Eerste zoekopdracht genereert de
                    benodigde data.
                  </p>
                )}
              </div>
            )}
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
          margin-top: 1rem;
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
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .slider-container {
          background-color: #ffffff;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .slider-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .slider-icon {
          font-size: 1.5rem;
          margin-right: 0.5rem;
        }

        .slider-title {
          font-size: 1.2rem;
          color: #333333;
          margin: 0;
        }

        .slider-value {
          font-size: 1rem;
          color: #007bff;
          font-weight: 500;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .left-label,
        .right-label {
          font-size: 0.9rem;
          color: #666666;
        }

        .concept-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
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
          margin-top: 0.5rem;
        }

        .marker {
          font-size: 1.2rem;
          color: #007bff;
        }

        .marker.center {
          transform: translateY(-2px);
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
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .favorites-section,
        .personal-recommendations-section {
          text-align: center;
          padding: 2rem;
          border-radius: 12px;
          color: white;
        }

        .favorites-section {
          background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
        }

        .personal-recommendations-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

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

        .favorites-button {
          color: #dc3545;
        }

        .personal-recommendations-button {
          color: #667eea;
        }

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
