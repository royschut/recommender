'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@radix-ui/themes'
import { useQuery } from '@tanstack/react-query'
import {
  MagnifyingGlassIcon,
  VideoIcon,
  ReloadIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  RocketIcon,
  LayersIcon,
  FaceIcon,
  GlobeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@radix-ui/react-icons'
import PlaygroundLayout from '../layout/PlaygroundLayout'
import { classNames } from '../utils/cn'
import Snackbar from '../components/ui/Snackbar'
import ResultModal from '../components/ResultModal'
import MovieCard, { Movie, SkeletonCard } from '../components/MovieCard'
import MoodSlider from '../components/MoodSlider'

interface Props {
  className?: string
}

const SmartSearchPage: React.FC<Props> = ({ className }) => {
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Slider states
  const [sliderValues, setSliderValues] = useState({
    adventure: 0,
    romance: 0,
    complexity: 0,
    emotion: 0,
    realism: 0,
  })

  // Slider configuration
  const sliders = [
    {
      key: 'adventure' as keyof typeof sliderValues,
      label: 'Calm',
      rightLabel: 'Adventure',
      leftIcon: <FaceIcon className="w-2.5 h-2.5 text-gray-500" />,
      rightIcon: <RocketIcon className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" />,
      ariaLabel: 'Calm to Adventure',
    },
    {
      key: 'romance' as keyof typeof sliderValues,
      label: 'Neutral',
      rightLabel: 'Romantic',
      leftIcon: <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />,
      rightIcon: <HeartIcon className="w-2.5 h-2.5 text-pink-400 flex-shrink-0" />,
      ariaLabel: 'Neutral to Romantic',
    },
    {
      key: 'complexity' as keyof typeof sliderValues,
      label: 'Simple',
      rightLabel: 'Complex',
      leftIcon: <div className="w-2.5 h-2.5 border border-gray-400 rounded" />,
      rightIcon: <LayersIcon className="w-2.5 h-2.5 text-gray-600 flex-shrink-0" />,
      ariaLabel: 'Simple to Complex',
    },
    {
      key: 'emotion' as keyof typeof sliderValues,
      label: 'Light',
      rightLabel: 'Emotional',
      leftIcon: <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 border border-yellow-400" />,
      rightIcon: <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />,
      ariaLabel: 'Light to Emotional',
    },
    {
      key: 'realism' as keyof typeof sliderValues,
      label: 'Realistic',
      rightLabel: 'Fantasy & Sci-fi',
      leftIcon: <div className="w-2.5 h-2.5 bg-green-500 rounded-sm" />,
      rightIcon: <GlobeIcon className="w-2.5 h-2.5 text-purple-500 flex-shrink-0" />,
      ariaLabel: 'Realistic to Fantasy & Sci-fi',
    },
  ]

  const suggestions = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      return fetch('/api/explore?limit=12').then((res) => res.json())
    },
  })

  const searchQuery = useQuery({
    queryKey: ['searchQuery', debouncedQuery],
    queryFn: async () => {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: debouncedQuery }),
      })

      if (response.ok) {
        const data = await response.json()

        // Show snackbar only for the first search
        // @todo
        if (data.results?.length > 0 && !hasShownSearchSnackbar) {
          setShowSearchSnackbar(true)
          setHasShownSearchSnackbar(true)
        }

        return data.results || []
      }
    },
    enabled: !!debouncedQuery,
  })

  const [query, setQuery] = useState('')
  const results: Movie[] = query ? searchQuery.data || [] : suggestions.data?.results || []
  const loading = query ? searchQuery.isLoading || searchQuery.isFetching : suggestions.isLoading

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showSearchSnackbar, setShowSearchSnackbar] = useState(false)
  const [hasShownSearchSnackbar, setHasShownSearchSnackbar] = useState(false)
  const [showAllSliders, setShowAllSliders] = useState(false)
  const [visibleSections, setVisibleSections] = useState<number[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    // Staggered animation for sections
    const timeouts = [
      setTimeout(() => setVisibleSections((prev) => [...prev, 0]), 200),
      setTimeout(() => setVisibleSections((prev) => [...prev, 1]), 1500),
      setTimeout(() => setVisibleSections((prev) => [...prev, 2]), 3000),
    ]

    return () => timeouts.forEach(clearTimeout)
  }, [])

  return (
    <PlaygroundLayout activeTab="smart-search">
      <div className={classNames('w-full space-y-12', className)}>
        <section
          className={`space-y-6 transition-all duration-700 ease-out ${
            visibleSections.includes(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Search */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-600 mb-1">
              Search stories by feeling, not just words
            </h2>
          </div>

          {/* Search Input */}
          <div className="relative max-w-3xl mx-auto">
            <MagnifyingGlassIcon className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-violet-400" />
            <input
              type="text"
              placeholder="Search by meaning..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={classNames(
                'w-full pl-16 pr-8 py-4 text-lg text-gray-900',
                'bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 rounded-2xl shadow-lg',
                'focus:border-violet-400 focus:ring-0 focus:outline-none',
                'focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all duration-300',
                'placeholder:text-gray-400 placeholder:font-light',
              )}
            />
          </div>
        </section>

        <section
          className={`space-y-6 transition-all duration-700 ease-out ${
            visibleSections.includes(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Explore */}
          <div className="flex justify-center mb-8">
            <div className="w-100 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semilight text-gray-600 mb-0.5">Or follow your mood</h2>
            <p className="text-gray-500 text-sm !mt-1">
              Use the sliders to shape your vibe — or search above
            </p>
          </div>

          {/* Mood Sliders */}
          <div className="max-w-lg mx-auto space-y-6 p-5 bg-violet-50 border border-violet-200 rounded-lg box-shadow-sm">
            <div className="space-y-5">
              {/* Always visible sliders (first 2) */}
              {sliders.slice(0, 2).map((slider) => (
                <MoodSlider
                  key={slider.key}
                  label={slider.label}
                  value={sliderValues[slider.key]}
                  onValueChange={(value) =>
                    setSliderValues((prev) => ({ ...prev, [slider.key]: value }))
                  }
                  leftIcon={slider.leftIcon}
                  rightIcon={slider.rightIcon}
                  rightLabel={slider.rightLabel}
                  ariaLabel={slider.ariaLabel}
                />
              ))}

              {/* Collapsible additional sliders */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  showAllSliders ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 -mt-2'
                }`}
              >
                {showAllSliders && (
                  <div className="space-y-5">
                    {sliders.slice(2).map((slider) => (
                      <MoodSlider
                        key={slider.key}
                        label={slider.label}
                        value={sliderValues[slider.key]}
                        onValueChange={(value) =>
                          setSliderValues((prev) => ({ ...prev, [slider.key]: value }))
                        }
                        leftIcon={slider.leftIcon}
                        rightIcon={slider.rightIcon}
                        rightLabel={slider.rightLabel}
                        ariaLabel={slider.ariaLabel}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Show more/less button */}
              <div className="flex justify-center pt-3">
                <Button
                  variant="ghost"
                  size="1"
                  onClick={() => setShowAllSliders(!showAllSliders)}
                  className={classNames(
                    'flex items-center gap-1.5 cursor-pointer text-xs',
                    'text-violet-500 hover:text-violet-600',
                    'hover:bg-violet-50 transition-colors duration-200',
                  )}
                >
                  {showAllSliders ? (
                    <>
                      <span>Show less</span>
                      <ChevronUpIcon className="w-4 h-4 transition-transform duration-200" />
                    </>
                  ) : (
                    <>
                      <span>More options</span>
                      <ChevronDownIcon className="w-4 h-4 transition-transform duration-200" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`space-y-6 transition-all duration-700 ease-out ${
            visibleSections.includes(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Suggestions */}
          <div className="text-center">
            <h2 className="text-xl font-light text-gray-600 mb-1">Suggestions for you</h2>
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
          {!loading && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 px-6 animate-fade-in">
              {results.map((movie) => (
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
        </section>

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
