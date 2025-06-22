'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  MagnifyingGlassIcon,
  StarFilledIcon,
  CalendarIcon,
  VideoIcon,
  ReloadIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons'
import { cn } from '../utils/cn'
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

interface SmartSearchTabProps {
  className?: string
}

const SmartSearchTab: React.FC<SmartSearchTabProps> = ({ className }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  const debouncedSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(query)
    }, 500)

    return () => clearTimeout(timer)
  }, [query, debouncedSearch])

  const displayResults = results.length > 0 ? results : []

  return (
    <div className={cn('max-w-6xl mx-auto space-y-12', className)}>
      {/* Search Input */}
      <div className="relative max-w-3xl mx-auto">
        <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
        <input
          type="text"
          placeholder="Zoek op gevoel, niet op exacte woorden..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            'w-full pl-14 pr-6 py-5 text-lg text-gray-900',
            'bg-white border-2 border-gray-200 rounded-xl shadow-sm',
            'focus:border-violet-400 focus:ring-0 focus:outline-none',
            'focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all duration-300',
            'placeholder:text-gray-400',
          )}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-8">
          <div className="text-center py-8">
            <ReloadIcon className="inline-block animate-spin w-8 h-8 text-violet-500 mb-4" />
            <p className="text-gray-600 text-lg font-medium flex items-center justify-center gap-2">
              <MagnifyingGlassIcon className="w-5 h-5" />
              Zoeken naar perfecte matches...
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </div>
        </div>
      )}

      {/* Results Grid */}
      {!loading && displayResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
          {displayResults.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => setSelectedMovie(movie)}
              isDummy={false}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !query && (
        <div className="text-center py-20">
          <VideoIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-gray-700 text-2xl font-semibold mb-3 flex items-center justify-center gap-2">
            <InfoCircledIcon className="w-6 h-6" />
            Ontdek je volgende favoriete film
          </h3>
          <p className="text-gray-500 text-lg mb-2 flex items-center justify-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
            Begin met typen om films te zoeken
          </p>
          <p className="text-gray-400 max-w-md mx-auto">
            Gebruik beschrijvingen zoals "romantische komedie" of "spannende thriller"
          </p>
        </div>
      )}

      {/* No Results */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-16">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-600 text-xl font-semibold mb-2 flex items-center justify-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
            Geen resultaten gevonden
          </h3>
          <p className="text-gray-500 text-lg mb-1">voor "{query}"</p>
          <p className="text-gray-400 flex items-center justify-center gap-2">
            <ReloadIcon className="w-4 h-4" />
            Probeer andere woorden of beschrijvingen
          </p>
        </div>
      )}

      <ResultModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onOpenChange={(open) => !open && setSelectedMovie(null)}
      />
    </div>
  )
}

interface MovieCardProps {
  movie: Movie
  onClick: () => void
  isDummy?: boolean
}

const SkeletonCard: React.FC = () => {
  return (
    <Card variant="default" padding="none" className="overflow-hidden animate-pulse">
      <div className="aspect-[2/3] bg-gray-200 relative">
        <div className="absolute top-3 left-3 w-16 h-6 bg-gray-300 rounded-md"></div>
        <div className="absolute top-3 right-3 w-12 h-6 bg-gray-300 rounded-md"></div>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>

        <div className="flex gap-1">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-14"></div>
          <div className="h-6 bg-gray-200 rounded-full w-12"></div>
        </div>

        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          <div className="h-3 bg-gray-200 rounded w-3/5"></div>
        </div>
      </div>
    </Card>
  )
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, isDummy = false }) => {
  const getPosterUrl = () => {
    return movie.image || movie.poster_path || movie.posterUrl
  }

  const getRating = () => {
    return movie.voteAverage || movie.vote_average
  }

  const getReleaseYear = () => {
    const date = movie.releaseDate || movie.release_date
    return date ? new Date(date).getFullYear() : null
  }

  const getGenres = () => {
    if (!movie.genres) return []
    if (Array.isArray(movie.genres)) {
      if (movie.genres.length > 0 && typeof movie.genres[0] === 'object') {
        return (movie.genres as Array<{ genre: string }>).map((g) => g.genre)
      }
      return movie.genres as string[]
    }
    return []
  }

  const getMatchScore = () => {
    return movie.similarityScore || movie.matchScore
  }

  const getDescription = () => {
    return movie.description || movie.overview
  }

  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'overflow-hidden cursor-pointer transition-all duration-300 group',
        'hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02]',
        isDummy && 'opacity-50 cursor-default hover:transform-none hover:shadow-soft',
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200">
        {getPosterUrl() ? (
          <img
            src={getPosterUrl()}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <span className="text-gray-500 text-xs">Geen poster</span>
            </div>
          </div>
        )}

        {getMatchScore() && (
          <div className="absolute top-3 left-3 bg-violet-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg flex items-center gap-1">
            <InfoCircledIcon className="w-3 h-3" />
            {Math.round((getMatchScore() || 0) * 100)}% match
          </div>
        )}

        {getRating() && (
          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm flex items-center gap-1">
            <StarFilledIcon className="w-3 h-3 text-yellow-400" />
            {getRating()?.toFixed(1)}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 group-hover:text-violet-600 transition-colors">
            {movie.title}
          </h3>
          {getReleaseYear() && (
            <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {getReleaseYear()}
            </p>
          )}
        </div>

        {getGenres().length > 0 && (
          <div className="flex flex-wrap gap-1">
            {getGenres()
              .slice(0, 3)
              .map((genre, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-full font-medium"
                >
                  {genre}
                </span>
              ))}
            {getGenres().length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                +{getGenres().length - 3}
              </span>
            )}
          </div>
        )}

        {getDescription() && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{getDescription()}</p>
        )}
      </div>
    </Card>
  )
}

export default SmartSearchTab
