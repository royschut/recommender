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

interface ExploreResponse {
  success: boolean
  results: Movie[]
  totalFound: number
  conceptWeights?: Record<string, number>
  filters?: {
    yearMin: number
    yearMax: number
    scoreMin: number
    scoreMax: number
  }
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

interface FilterSlider {
  id: string
  label: string
  min: number
  max: number
  value: [number, number] // [min, max] range
  step: number
  icon: string
  formatValue: (value: number) => string
}

const conceptSliders: ConceptSlider[] = [
  {
    id: 'adventure',
    label: 'Avontuur',
    leftLabel: 'Rustig',
    rightLabel: 'Avontuurlijk',
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
    leftLabel: 'Eenvoudig',
    rightLabel: 'Complex',
    value: 0,
    icon: '🧠',
  },
  {
    id: 'emotion',
    label: 'Emotie',
    leftLabel: 'Licht',
    rightLabel: 'Intens',
    value: 0,
    icon: '🎭',
  },
  {
    id: 'realism',
    label: 'Realisme',
    leftLabel: 'Fantasy & Sci-Fi',
    rightLabel: 'Realistisch',
    value: 0,
    icon: '🌟',
  },
]

const filterSliders: FilterSlider[] = [
  {
    id: 'year',
    label: 'Jaartal',
    min: 1900,
    max: 2025,
    value: [1900, 2025],
    step: 1,
    icon: '📅',
    formatValue: (value) => value.toString(),
  },
  {
    id: 'score',
    label: 'Score',
    min: 0,
    max: 10,
    value: [0, 10],
    step: 0.1,
    icon: '⭐',
    formatValue: (value) => value.toFixed(1),
  },
]

export default function ExplorePage() {
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sliders, setSliders] = useState<ConceptSlider[]>(conceptSliders)
  const [filters, setFilters] = useState<FilterSlider[]>(filterSliders)
  const [explorePerformed, setExplorePerformed] = useState(false)
  const [lastConceptWeights, setLastConceptWeights] = useState<Record<string, number>>({})
  const router = useRouter()

  // Debounce slider changes for real-time exploration
  const debouncedSliders = useDebounce(sliders, 500)
  const debouncedFilters = useDebounce(filters, 500)

  // Load initial random films on page load
  useEffect(() => {
    loadInitialFilms()
  }, [])

  // Perform explore when sliders or filters change
  useEffect(() => {
    const hasNonNeutralSlider = sliders.some((slider) => slider.value !== 0)
    const hasActiveFilters = filters.some(
      (filter) => filter.value[0] !== filter.min || filter.value[1] !== filter.max,
    )

    if (hasNonNeutralSlider || hasActiveFilters) {
      performExplore()
    } else if (explorePerformed) {
      // Load initial films again when all sliders and filters are reset
      loadInitialFilms()
      setExplorePerformed(false)
    }
  }, [debouncedSliders, debouncedFilters])

  const loadInitialFilms = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/explore?limit=12')

      const data: ExploreResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden bij het laden van films')
      }

      setResults(data.results || [])
      setLastConceptWeights({})
    } catch (err) {
      console.error('Load initial films error:', err)
      setError(err instanceof Error ? err.message : 'Er is een onbekende fout opgetreden')
    } finally {
      setLoading(false)
    }
  }, [])

  const performExplore = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Prepare concept weights for the API
      const conceptWeights = sliders.reduce(
        (acc, slider) => {
          acc[slider.id] = slider.value
          return acc
        },
        {} as Record<string, number>,
      )

      // Build URL with query parameters
      const searchParams = new URLSearchParams()
      searchParams.set('limit', '12')

      // Add concept weights as parameters
      Object.entries(conceptWeights).forEach(([concept, weight]) => {
        if (weight !== 0) {
          searchParams.set(concept, weight.toString())
        }
      })

      // Add filter parameters
      const yearFilter = filters.find((f) => f.id === 'year')
      const scoreFilter = filters.find((f) => f.id === 'score')

      if (
        yearFilter &&
        (yearFilter.value[0] !== yearFilter.min || yearFilter.value[1] !== yearFilter.max)
      ) {
        if (yearFilter.value[0] > yearFilter.min) {
          searchParams.set('yearMin', yearFilter.value[0].toString())
        }
        if (yearFilter.value[1] < yearFilter.max) {
          searchParams.set('yearMax', yearFilter.value[1].toString())
        }
      }

      if (
        scoreFilter &&
        (scoreFilter.value[0] !== scoreFilter.min || scoreFilter.value[1] !== scoreFilter.max)
      ) {
        if (scoreFilter.value[0] > scoreFilter.min) {
          searchParams.set('scoreMin', scoreFilter.value[0].toString())
        }
        if (scoreFilter.value[1] < scoreFilter.max) {
          searchParams.set('scoreMax', scoreFilter.value[1].toString())
        }
      }

      const response = await fetch(`/api/explore?${searchParams.toString()}`)

      const data: ExploreResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden bij het verkennen')
      }

      setResults(data.results || [])
      setLastConceptWeights(data.conceptWeights || {})
      setExplorePerformed(true)
    } catch (err) {
      console.error('Explore error:', err)
      setError(err instanceof Error ? err.message : 'Er is een onbekende fout opgetreden')
    } finally {
      setLoading(false)
    }
  }, [sliders, filters])

  const handleMovieClick = (movieId: string) => {
    router.push(`/movie/${movieId}`)
  }

  const handleFavoriteChange = () => {
    // No special handling needed on explore page
  }

  const handleSliderChange = (sliderId: string, value: number) => {
    setSliders((prev) =>
      prev.map((slider) => (slider.id === sliderId ? { ...slider, value } : slider)),
    )
  }

  const handleFilterChange = (filterId: string, value: [number, number]) => {
    setFilters((prev) =>
      prev.map((filter) => (filter.id === filterId ? { ...filter, value } : filter)),
    )
  }

  const resetSliders = () => {
    setSliders((prev) => prev.map((slider) => ({ ...slider, value: 0 })))
    setFilters((prev) => prev.map((filter) => ({ ...filter, value: [filter.min, filter.max] })))
  }

  const getRandomFilms = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/explore?limit=12')

      const data: ExploreResponse = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Er is een fout opgetreden bij het laden van willekeurige films',
        )
      }

      setResults(data.results || [])
      setExplorePerformed(true)
    } catch (err) {
      console.error('Random films error:', err)
      setError(err instanceof Error ? err.message : 'Er is een onbekende fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="explore-container">
      {/* Concept Sliders */}
      <div className="concept-sliders-container">
        <div className="sliders-header">
          <h3>🎭 Explore</h3>
          <div className="slider-controls">
            <button onClick={resetSliders} className="reset-button" type="button">
              🔄 Reset Alle Filters
            </button>
            {/* <button onClick={getRandomFilms} className="random-button" type="button">
              🎲 Willekeurige Films
            </button> */}
          </div>
        </div>

        <div className="sliders-grid">
          {sliders.map((slider) => (
            <div key={slider.id} className="slider-container">
              <div className="slider-header">
                <span className="slider-icon">{slider.icon}</span>
                <h4 className="slider-title">{slider.label}</h4>
              </div>
              <span className="slider-value">
                {slider.value === 0
                  ? 'Neutraal'
                  : slider.value > 0
                    ? `+${(slider.value * 100).toFixed(0)}%`
                    : `${(slider.value * 100).toFixed(0)}%`}
                {slider.value < 0
                  ? ` (${slider.leftLabel})`
                  : slider.value > 0
                    ? ` (${slider.rightLabel})`
                    : ''}
              </span>

              {/* <div className="slider-labels">
                <span className="left-label">{slider.leftLabel}</span>
                <span className="right-label">{slider.rightLabel}</span>
              </div> */}

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
            </div>
          ))}
        </div>

        {/* Filter Sliders */}
        <div className="filters-section">
          <h4>🔍 Filters</h4>
          <div className="filters-grid">
            {filters.map((filter) => (
              <div key={filter.id} className="filter-container">
                <div className="slider-header">
                  <span className="slider-icon">{filter.icon}</span>
                  <h4 className="slider-title">{filter.label}</h4>
                </div>
                <span className="slider-value">
                  {filter.value[0] === filter.min && filter.value[1] === filter.max
                    ? 'Alle'
                    : `${filter.formatValue(filter.value[0])} - ${filter.formatValue(filter.value[1])}`}
                </span>

                <div className="dual-range-container">
                  <div className="range-track">
                    <div
                      className="range-progress"
                      style={{
                        left: `${((filter.value[0] - filter.min) / (filter.max - filter.min)) * 100}%`,
                        width: `${((filter.value[1] - filter.value[0]) / (filter.max - filter.min)) * 100}%`,
                      }}
                    ></div>
                  </div>

                  <input
                    type="range"
                    min={filter.min}
                    max={filter.max}
                    step={filter.step}
                    value={filter.value[0]}
                    onChange={(e) => {
                      const newMin = parseFloat(e.target.value)
                      if (newMin <= filter.value[1]) {
                        handleFilterChange(filter.id, [newMin, filter.value[1]])
                      }
                    }}
                    disabled={loading}
                    className="dual-range-slider slider-min"
                  />

                  <input
                    type="range"
                    min={filter.min}
                    max={filter.max}
                    step={filter.step}
                    value={filter.value[1]}
                    onChange={(e) => {
                      const newMax = parseFloat(e.target.value)
                      if (newMax >= filter.value[0]) {
                        handleFilterChange(filter.id, [filter.value[0], newMax])
                      }
                    }}
                    disabled={loading}
                    className="dual-range-slider slider-max"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      {/* <div className="action-sections">
        <div className="search-section">
          <button onClick={() => router.push('/search')} className="search-button">
            🔍 Zoeken met Tekst
          </button>
          <p className="section-description">Zoek naar specifieke films met een zoekterm</p>
        </div>

        <div className="favorites-section">
          <button onClick={() => router.push('/favorites')} className="favorites-button">
            ❤️ Mijn Favorieten
          </button>
          <p className="section-description">Bekijk en beheer je favoriete films</p>
        </div>

        <div className="personal-recommendations-section">
          <button
            onClick={() => router.push('/personal')}
            className="personal-recommendations-button"
          >
            ✨ Persoonlijke Aanbevelingen
          </button>
          <p className="section-description">
            Krijg gepersonaliseerde filmsuggties op basis van je favorieten
          </p>
        </div>
      </div> */}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {explorePerformed && !loading && !error && (
        <div className="results-summary">
          {/* <p>
            {results.length === 0
              ? 'Geen films gevonden met deze instellingen'
              : `${results.length} film${results.length !== 1 ? 's' : ''} gevonden`}
          </p> */}

          {/* {Object.values(lastConceptWeights).some((w) => w !== 0) && (
            <div className="concept-weights-applied">
              <h4>🎛️ Actieve Concept Filters:</h4>
              <div className="applied-weights">
                {Object.entries(lastConceptWeights)
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
            </div>
          )} */}
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

        .explore-container {
          min-height: 100vh;
          background-color: #ffffff;
          color: #333333;
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem;
        }

        .explore-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .explore-header h1 {
          font-size: 2rem;
          color: #222222;
          margin-bottom: 0.3rem;
        }

        .explore-header p {
          font-size: 1rem;
          color: #555555;
        }

        .concept-sliders-container {
          background-color: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .sliders-header {
          margin-bottom: 1rem;
        }

        .sliders-header h3 {
          font-size: 1.5rem;
          margin-bottom: 0.3rem;
          color: #333333;
        }

        .sliders-header p {
          font-size: 0.9rem;
          color: #666666;
          margin-bottom: 0.8rem;
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

        .slider-controls {
          display: flex;
          gap: 0.8rem;
          margin-top: 0.8rem;
        }

        .reset-button,
        .random-button {
          padding: 0.6rem 1.2rem;
          font-size: 0.9rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
        }

        .reset-button {
          background-color: #dc3545;
          color: white;
        }

        .reset-button:hover {
          background-color: #c82333;
          transform: translateY(-1px);
        }

        .random-button {
          background-color: #28a745;
          color: white;
        }

        .random-button:hover {
          background-color: #218838;
          transform: translateY(-1px);
        }

        .sliders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.8rem;
        }

        .slider-container {
          background-color: #ffffff;
          padding: 0.8rem;
          border-radius: 6px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
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
          background: linear-gradient(to right, #dc3545 0%, #007bff 50%, #28a745 100%);
          outline: none;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .concept-slider:hover {
          opacity: 1;
        }

        .concept-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #007bff;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .concept-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #007bff;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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

        .filters-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 2px solid #e9ecef;
        }

        .filters-section h4 {
          margin-bottom: 1rem;
          color: #333333;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .filter-container {
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
        }

        .filter-container:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .dual-range-container {
          position: relative;
          margin-top: 1rem;
          height: 6px;
        }

        .range-track {
          position: absolute;
          width: 100%;
          height: 6px;
          background-color: #ddd;
          border-radius: 3px;
          top: 0;
        }

        .range-progress {
          position: absolute;
          height: 6px;
          background-color: #007bff;
          border-radius: 3px;
          top: 0;
        }

        .dual-range-slider {
          position: absolute;
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: transparent;
          outline: none;
          top: 0;
          pointer-events: none;
        }

        .dual-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #007bff;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
          position: relative;
          z-index: 2;
        }

        .dual-range-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #007bff;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
        }

        .dual-range-slider.slider-max::-webkit-slider-thumb {
          background: #28a745;
        }

        .dual-range-slider.slider-max::-moz-range-thumb {
          background: #28a745;
        }

        .action-sections {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .search-section,
        .favorites-section,
        .personal-recommendations-section {
          text-align: center;
          padding: 1.5rem;
          border-radius: 8px;
          color: white;
        }

        .search-section {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        }

        .favorites-section {
          background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
        }

        .personal-recommendations-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .search-button,
        .favorites-button,
        .personal-recommendations-button {
          padding: 0.8rem 1.5rem;
          font-size: 1rem;
          background-color: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          margin-bottom: 0.4rem;
        }

        .search-button {
          color: #007bff;
        }

        .favorites-button {
          color: #dc3545;
        }

        .personal-recommendations-button {
          color: #667eea;
        }

        .search-button:hover,
        .favorites-button:hover,
        .personal-recommendations-button:hover {
          background-color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .section-description {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
          margin: 0;
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
          margin: 1.5rem 0;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 6px;
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

        @media (max-width: 768px) {
          .explore-container {
            padding: 0.8rem;
          }

          .explore-header h1 {
            font-size: 1.8rem;
          }

          .action-sections {
            grid-template-columns: 1fr;
            gap: 0.8rem;
          }

          .slider-controls {
            flex-direction: column;
            gap: 0.5rem;
          }

          .sliders-grid {
            grid-template-columns: 1fr;
          }

          .filters-grid {
            grid-template-columns: 1fr;
            gap: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}
