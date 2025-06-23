'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  MagnifyingGlassIcon,
  ReloadIcon,
  VideoIcon,
  StarFilledIcon,
  CalendarIcon,
} from '@radix-ui/react-icons'
import { classNames } from '../utils/cn'
import Card from './ui/Card'
import ResultModal from './ResultModal'

interface Movie {
  id: string
  title: string
  description?: string
  overview?: string
  image?: string
  poster_path?: string
  posterUrl?: string
  voteAverage?: number
  vote_average?: number
  releaseDate?: string
  release_date?: string
  genres?: Array<{ genre: string }> | string[]
  similarityScore?: number
  matchScore?: number
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

interface ExploreTabProps {
  className?: string
}

const ExploreTab: React.FC<ExploreTabProps> = ({ className }) => {
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [conceptSliderValues, setConceptSliderValues] = useState<ConceptSlider[]>(conceptSliders)
  const [filterValues, setFilterValues] = useState<FilterSlider[]>(filterSliders)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])

  // Debounce slider changes
  const debouncedConceptSliders = useDebounce(conceptSliderValues, 1000)
  const debouncedFilters = useDebounce(filterValues, 1000)
  const debouncedGenres = useDebounce(selectedGenres, 500)

  // Load initial films and genres
  useEffect(() => {
    loadInitialFilms()
    loadAvailableGenres()
  }, [])

  // Update results when sliders change
  useEffect(() => {
    if (debouncedConceptSliders || debouncedFilters || debouncedGenres) {
      exploreFilms()
    }
  }, [debouncedConceptSliders, debouncedFilters, debouncedGenres])

  const loadInitialFilms = async () => {
    setLoading(true)

    // Better mock data with real movie titles and poster URLs
    const mockMovies = Array.from({ length: 24 }, (_, i) => ({
      id: `movie-${i + 1}`,
      title:
        [
          'The Shawshank Redemption',
          'The Godfather',
          'Pulp Fiction',
          'The Dark Knight',
          'Forrest Gump',
          'Inception',
          'Fight Club',
          'The Matrix',
          'Goodfellas',
          'The Lord of the Rings',
          'Star Wars',
          'Casablanca',
          "Schindler's List",
          'Interstellar',
          'Parasite',
          'Avengers: Endgame',
          'Titanic',
          'Gladiator',
          'The Departed',
          'The Silence of the Lambs',
          'Saving Private Ryan',
          'Heat',
          'Se7en',
          'The Prestige',
        ][i] || `Movie ${i + 1}`,
      image:
        [
          'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
          'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
          'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
          'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
          'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
          'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
          'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
          'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',
          'https://image.tmdb.org/t/p/w500/v75VLH4CjKtj7z1qRnSEjnNgT56.jpg',
          'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
          'https://image.tmdb.org/t/p/w500/5K7cOHoay2mZusSLezBOY0Qxh8a.jpg',
          'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
          'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
          'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
          'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
          'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',
          'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
          'https://image.tmdb.org/t/p/w500/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg',
          'https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg',
          'https://image.tmdb.org/t/p/w500/pIkRyD18kl4FhoCNQuWxWu5cBLM.jpg',
          'https://image.tmdb.org/t/p/w500/zb6fM1CX41D9rF9hdgclu0peUmy.jpg',
          'https://image.tmdb.org/t/p/w500/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg',
          'https://image.tmdb.org/t/p/w500/1QpbQCeBxQE7fopz7VLKgKDz6oa.jpg',
        ][i] || '/api/placeholder/300/450',
      poster_path:
        [
          'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
          'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
          'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
          'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
          'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
          'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
          'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
          'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',
          'https://image.tmdb.org/t/p/w500/v75VLH4CjKtj7z1qRnSEjnNgT56.jpg',
          'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
          'https://image.tmdb.org/t/p/w500/5K7cOHoay2mZusSLezBOY0Qxh8a.jpg',
          'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
          'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
          'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
          'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
          'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',
          'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
          'https://image.tmdb.org/t/p/w500/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg',
          'https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg',
          'https://image.tmdb.org/t/p/w500/pIkRyD18kl4FhoCNQuWxWu5cBLM.jpg',
          'https://image.tmdb.org/t/p/w500/zb6fM1CX41D9rF9hdgclu0peUmy.jpg',
          'https://image.tmdb.org/t/p/w500/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg',
          'https://image.tmdb.org/t/p/w500/1QpbQCeBxQE7fopz7VLKgKDz6oa.jpg',
        ][i] || '/api/placeholder/300/450',
      voteAverage: 5 + Math.random() * 4,
      releaseDate: `${2010 + Math.floor(Math.random() * 14)}-01-01`,
      genres: [
        ['Drama', 'Crime'],
        ['Crime', 'Drama'],
        ['Crime', 'Thriller'],
        ['Action', 'Crime'],
        ['Drama', 'Romance'],
        ['Sci-Fi', 'Thriller'],
        ['Drama', 'Thriller'],
        ['Action', 'Sci-Fi'],
        ['Crime', 'Drama'],
        ['Adventure', 'Fantasy'],
        ['Sci-Fi', 'Adventure'],
        ['Drama', 'Romance'],
        ['Drama', 'History'],
        ['Sci-Fi', 'Drama'],
        ['Comedy', 'Drama'],
        ['Action', 'Adventure'],
        ['Drama', 'Romance'],
        ['Action', 'Drama'],
        ['Crime', 'Drama'],
        ['Horror', 'Thriller'],
        ['War', 'Drama'],
        ['Action', 'Crime'],
        ['Crime', 'Thriller'],
        ['Mystery', 'Drama'],
      ][i] || ['Adventure', 'Drama'],
      overview: 'A compelling story that captivates audiences worldwide',
    }))

    try {
      const response = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 24 }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || mockMovies)
      } else {
        setResults(mockMovies)
      }
    } catch (error) {
      console.error('Failed to load initial films:', error)
      setResults(mockMovies)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableGenres = async () => {
    try {
      const response = await fetch('/api/genres')
      if (response.ok) {
        const data = await response.json()
        setAvailableGenres(data.genres || [])
      }
    } catch (error) {
      console.error('Failed to load genres:', error)
      // Mock data fallback
      setAvailableGenres([
        'Action',
        'Adventure',
        'Comedy',
        'Drama',
        'Horror',
        'Romance',
        'Sci-Fi',
        'Thriller',
        'Fantasy',
        'Animation',
        'Documentary',
        'Crime',
      ])
    }
  }

  const exploreFilms = async () => {
    setLoading(true)
    try {
      // Build concept weights
      const conceptWeights: Record<string, number> = {}
      conceptSliderValues.forEach((slider) => {
        conceptWeights[slider.id] = slider.value
      })

      // Build filters
      const yearFilter = filterValues.find((f) => f.id === 'year')
      const scoreFilter = filterValues.find((f) => f.id === 'score')

      const requestBody = {
        conceptWeights,
        yearMin: yearFilter?.value[0] || 1900,
        yearMax: yearFilter?.value[1] || 2025,
        scoreMin: scoreFilter?.value[0] || 0,
        scoreMax: scoreFilter?.value[1] || 10,
        selectedGenres,
        limit: 24,
      }

      const response = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Failed to explore films:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateConceptSlider = (id: string, value: number) => {
    setConceptSliderValues((prev) =>
      prev.map((slider) => (slider.id === id ? { ...slider, value } : slider)),
    )
  }

  const updateFilterSlider = (id: string, value: [number, number]) => {
    setFilterValues((prev) =>
      prev.map((filter) => (filter.id === id ? { ...filter, value } : filter)),
    )
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    )
  }

  return (
    <div className={classNames('w-full space-y-8', className)}>
      <p className="text-xs text-center text-gray-400 font-light tracking-wide uppercase">
        Pas je smaak aan en ontdek films die perfect bij je passen
      </p>

      {/* Controls Section */}
      <div className="space-y-6">
        {/* Concept Sliders */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
            Smaak Voorkeuren
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conceptSliderValues.map((slider) => (
              <ConceptSliderComponent
                key={slider.id}
                slider={slider}
                onChange={(value) => updateConceptSlider(slider.id, value)}
              />
            ))}
          </div>
        </div>

        {/* Filter Sliders */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterValues.map((filter) => (
              <FilterSliderComponent
                key={filter.id}
                filter={filter}
                onChange={(value) => updateFilterSlider(filter.id, value)}
              />
            ))}
          </div>
        </div>

        {/* Genre Selection */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Genres</h2>
          <div className="flex flex-wrap gap-2">
            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={classNames(
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  selectedGenres.includes(genre)
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Ontdek Films</h2>
          {loading && (
            <div className="flex items-center gap-2 text-violet-600">
              <ReloadIcon className="w-4 h-4 animate-spin" />
              <span className="text-sm">Laden...</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {Array.from({ length: 24 }, (_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 animate-fade-in">
            {results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onClick={() => setSelectedMovie(movie)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <VideoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Geen films gevonden met de huidige instellingen</p>
          </div>
        )}
      </div>

      {/* Result Modal */}
      <ResultModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onOpenChange={(open) => !open && setSelectedMovie(null)}
        onMovieChange={(movie) => setSelectedMovie(movie)}
      />
    </div>
  )
}

// Concept Slider Component
interface ConceptSliderComponentProps {
  slider: ConceptSlider
  onChange: (value: number) => void
}

const ConceptSliderComponent: React.FC<ConceptSliderComponentProps> = ({ slider, onChange }) => {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <span className="text-lg">{slider.icon}</span>
          {slider.label}
        </h3>
        <span className="text-sm text-gray-500">
          {slider.value > 0.1
            ? slider.rightLabel
            : slider.value < -0.1
              ? slider.leftLabel
              : 'Neutraal'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{slider.leftLabel}</span>
          <span>{slider.rightLabel}</span>
        </div>

        <div className="relative">
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={slider.value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-gradient"
            style={{
              background: `linear-gradient(to right,
                #f3f4f6 0%,
                #f3f4f6 ${(slider.value + 1) * 50 - 2}%,
                #8b5cf6 ${(slider.value + 1) * 50 - 2}%,
                #8b5cf6 ${(slider.value + 1) * 50 + 2}%,
                #f3f4f6 ${(slider.value + 1) * 50 + 2}%,
                #f3f4f6 100%)`,
            }}
          />

          {/* Center indicator */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-0.5 h-4 bg-gray-400"
            style={{ left: '50%', marginLeft: '-1px' }}
          />
        </div>

        <div className="text-center">
          <span className="inline-block px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs font-medium">
            {slider.value === 0
              ? 'Neutraal'
              : slider.value > 0
                ? `+${slider.value.toFixed(1)}`
                : slider.value.toFixed(1)}
          </span>
        </div>
      </div>
    </Card>
  )
}

// Filter Slider Component
interface FilterSliderComponentProps {
  filter: FilterSlider
  onChange: (value: [number, number]) => void
}

const FilterSliderComponent: React.FC<FilterSliderComponentProps> = ({ filter, onChange }) => {
  const handleMinChange = (value: number) => {
    onChange([value, filter.value[1]])
  }

  const handleMaxChange = (value: number) => {
    onChange([filter.value[0], value])
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <span className="text-lg">{filter.icon}</span>
          {filter.label}
        </h3>
        <span className="text-sm text-gray-500">
          {filter.formatValue(filter.value[0])} - {filter.formatValue(filter.value[1])}
        </span>
      </div>

      <div className="space-y-4">
        {/* Min Value Slider */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Minimum</label>
          <input
            type="range"
            min={filter.min}
            max={filter.max}
            step={filter.step}
            value={filter.value[0]}
            onChange={(e) => handleMinChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-violet"
          />
          <div className="text-center">
            <span className="inline-block px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs font-medium">
              {filter.formatValue(filter.value[0])}
            </span>
          </div>
        </div>

        {/* Max Value Slider */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Maximum</label>
          <input
            type="range"
            min={filter.min}
            max={filter.max}
            step={filter.step}
            value={filter.value[1]}
            onChange={(e) => handleMaxChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-violet"
          />
          <div className="text-center">
            <span className="inline-block px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs font-medium">
              {filter.formatValue(filter.value[1])}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Movie Card Component
interface MovieCardProps {
  movie: Movie
  onClick: () => void
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const imageUrl = movie.image || movie.poster_path || movie.posterUrl || '/api/placeholder/300/450'
  const rating = movie.voteAverage || movie.vote_average || 0
  const releaseYear = movie.releaseDate?.split('-')[0] || movie.release_date?.split('-')[0] || 'N/A'
  const genres = Array.isArray(movie.genres)
    ? typeof movie.genres[0] === 'string'
      ? movie.genres
      : movie.genres.map((g) => (g as any).genre)
    : []

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transform transition-transform duration-200 hover:scale-105"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
        <div className="aspect-[2/3] relative overflow-hidden">
          <img
            src={imageUrl}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />

          {/* Rating overlay */}
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1">
            <StarFilledIcon className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-medium">{rating.toFixed(1)}</span>
          </div>

          {/* Match score overlay */}
          {movie.matchScore && (
            <div className="absolute top-2 left-2 bg-violet-500 text-white px-2 py-1 rounded-full">
              <span className="text-xs font-bold">{Math.round(movie.matchScore)}% MATCH</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-violet-600 transition-colors">
            {movie.title}
          </h3>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              <span>{releaseYear}</span>
            </div>
          </div>

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {genres.slice(0, 2).map((genre, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  {genre}
                </span>
              ))}
              {genres.length > 2 && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{genres.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// Movie Card Skeleton Component
const MovieCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden border-0 shadow-lg animate-pulse">
      <div className="aspect-[2/3] bg-gray-300"></div>
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        <div className="flex gap-1">
          <div className="h-6 bg-gray-300 rounded w-16"></div>
          <div className="h-6 bg-gray-300 rounded w-12"></div>
        </div>
      </div>
    </Card>
  )
}

export default ExploreTab
