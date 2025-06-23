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
import PlaygroundLayout from '../layout/PlaygroundLayout'
import { cn } from '../utils/cn'
import Card from '../components/ui/Card'
import Snackbar from '../components/ui/Snackbar'
import ResultModal from '../components/ResultModal'
import MovieCard, { Movie, SkeletonCard } from '../components/MovieCard'

interface Props {
  className?: string
}

const SmartSearchPage: React.FC<Props> = ({ className }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showSearchSnackbar, setShowSearchSnackbar] = useState(false)
  const [hasShownSearchSnackbar, setHasShownSearchSnackbar] = useState(false)

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

        // Show snackbar only for the first search
        if (data.results?.length > 0 && !hasShownSearchSnackbar) {
          setShowSearchSnackbar(true)
          setHasShownSearchSnackbar(true)
        }
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
    <PlaygroundLayout activeTab="smart-search">
      <div className={cn('w-full space-y-12', className)}>
        <p className="text-xs text-center text-gray-400 mt-4 font-light tracking-wide uppercase">
          {'Ontdek, verken en experimenteer met aanbevelingen'}
        </p>

        {/* Search Input */}
        <div className="relative max-w-3xl mx-auto">
          <MagnifyingGlassIcon className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-violet-400" />
          <input
            type="text"
            placeholder="Zoek op gevoel, niet op exacte woorden..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              'w-full pl-16 pr-8 py-4 text-lg text-gray-900',
              'bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 rounded-2xl shadow-lg',
              'focus:border-violet-400 focus:ring-0 focus:outline-none',
              'focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all duration-300',
              'placeholder:text-gray-400 placeholder:font-light',
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 px-6">
              {Array.from({ length: 8 }, (_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && displayResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 px-6 animate-fade-in">
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
            <p className="text-gray-500 text-lg mb-2 flex items-center justify-center gap-2">
              <MagnifyingGlassIcon className="w-5 h-5" />
              Begin met typen om films te zoeken
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
          onMovieChange={(movie) => setSelectedMovie(movie)}
        />

        <Snackbar
          open={showSearchSnackbar}
          onOpenChange={setShowSearchSnackbar}
          message="Zoekresultaten semantisch gevonden, op basis van jouw zoekterm. Zie de match score."
          variant="info"
          icon={<MagnifyingGlassIcon className="w-5 h-5" />}
        />
      </div>
    </PlaygroundLayout>
  )
}

export default SmartSearchPage
