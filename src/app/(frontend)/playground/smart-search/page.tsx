'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@radix-ui/themes'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  MagnifyingGlassIcon,
  ReloadIcon,
  HeartIcon,
  RocketIcon,
  LayersIcon,
  FaceIcon,
  GlobeIcon,
  ChevronDownIcon,
  SliderIcon,
  PersonIcon,
  Cross2Icon,
} from '@radix-ui/react-icons'
import PlaygroundLayout from '../layout/PlaygroundLayout'
import { classNames } from '../utils/cn'
import Snackbar from '../components/ui/Snackbar'
import ResultModal from '../components/ResultModal'
import MovieCard, { Movie } from '../components/MovieCard'
import MoodSlider from '../components/MoodSlider'
import { Popover, ToggleGroup } from 'radix-ui'
import useDebounce from '../hooks/useDebounce'

// Slider configuration
type SliderKey = 'adventure' | 'romance' | 'complexity' | 'emotion' | 'realism'

const sliders = [
  {
    key: 'adventure' as SliderKey,
    label: 'Calm',
    rightLabel: 'Adventure',
    leftIcon: <FaceIcon className="w-2.5 h-2.5 text-gray-500" />,
    rightIcon: <RocketIcon className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" />,
    ariaLabel: 'Calm to Adventure',
  },
  {
    key: 'romance' as SliderKey,
    label: 'Neutral',
    rightLabel: 'Romantic',
    leftIcon: <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />,
    rightIcon: <HeartIcon className="w-2.5 h-2.5 text-pink-400 flex-shrink-0" />,
    ariaLabel: 'Neutral to Romantic',
  },
  {
    key: 'complexity' as SliderKey,
    label: 'Simple',
    rightLabel: 'Complex',
    leftIcon: <div className="w-2.5 h-2.5 border border-gray-400 rounded" />,
    rightIcon: <LayersIcon className="w-2.5 h-2.5 text-gray-600 flex-shrink-0" />,
    ariaLabel: 'Simple to Complex',
  },
  {
    key: 'emotion' as SliderKey,
    label: 'Light',
    rightLabel: 'Emotional',
    leftIcon: <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 border border-yellow-400" />,
    rightIcon: <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />,
    ariaLabel: 'Light to Emotional',
  },
  {
    key: 'realism' as SliderKey,
    label: 'Realistic',
    rightLabel: 'Fantasy & Sci-fi',
    leftIcon: <div className="w-2.5 h-2.5 bg-green-500 rounded-sm" />,
    rightIcon: <GlobeIcon className="w-2.5 h-2.5 text-purple-500 flex-shrink-0" />,
    ariaLabel: 'Realistic to Fantasy & Sci-fi',
  },
]

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

  const debouncedConceptSliders = useDebounce(sliderValues, 400)

  const suggestions = useQuery({
    queryKey: ['suggestions', debouncedConceptSliders],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      // Build filters
      // const yearFilter = filterValues.find((f) => f.id === 'year')
      // const scoreFilter = filterValues.find((f) => f.id === 'score')
      const requestBody = {
        conceptWeights: debouncedConceptSliders,
        // Uncomment and implement filters if needed
        // yearMin: yearFilter?.value[0] || 1900,
        // yearMax: yearFilter?.value[1] || 2025,
        // scoreMin: scoreFilter?.value[0] || 0,
        // scoreMax: scoreFilter?.value[1] || 10,
        // selectedGenres,
        limit: 24,
      }

      return fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }).then((res) => res.json())
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
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showSearchSnackbar, setShowSearchSnackbar] = useState(false)
  const [hasShownSearchSnackbar, setHasShownSearchSnackbar] = useState(false)
  const [showMoodPanel, setShowMoodPanel] = useState(false)
  const [isPersonalised, setIsPersonalised] = useState(false)
  const [visibleSections, setVisibleSections] = useState<number[]>([])

  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const suggestionsRef = React.useRef<HTMLDivElement>(null)

  const fadeStyle = (timing: number, includeY = true, duration = 700, excludeTiming = -1) => {
    return classNames(
      `transition-all duration-${duration} transform-y-200 ease-out `,
      `${visibleSections.includes(timing) && !visibleSections.includes(excludeTiming) ? 'opacity-100' : 'opacity-0'}`,
      includeY ? `${visibleSections.includes(timing) ? 'translate-y-0' : 'translate-y-8'}` : '',
    )
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    // Staggered animation for sections
    const timeouts = [
      setTimeout(() => setVisibleSections((prev) => [...prev, 0]), 200),
      setTimeout(() => setVisibleSections((prev) => [...prev, 1]), 1500),
      setTimeout(() => setVisibleSections((prev) => [...prev, 2]), 2500),
      setTimeout(() => setVisibleSections((prev) => [...prev, 3]), 3000),
    ]

    return () => timeouts.forEach(clearTimeout)
  }, [])

  return (
    <PlaygroundLayout>
      <div className="flex items-center justify-end mt-2 mb-6 px-4">
        <ToggleGroup.Root
          type="single"
          value={isPersonalised ? 'personalised' : 'smart-search'}
          className={classNames(
            'inline-flex gap-1 rounded-full bg-violet-50 p-1 shadow-inner',
            fadeStyle(2, false),
          )}
          onValueChange={(value) => setIsPersonalised(value === 'personalised')}
        >
          <ToggleGroup.Item
            value="smart-search"
            className={classNames(
              'flex gap-1 items-center px-4 py-1 text-sm rounded-full transition-colors cursor-pointer',
              !isPersonalised
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-500 hover:bg-violet-100 hover:text-violet-700',
            )}
          >
            <MagnifyingGlassIcon />
            {'Smart Explore'}
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="personalised"
            className={classNames(
              'flex gap-1 items-center px-4 py-1 text-sm rounded-full transition-colors cursor-pointer',
              isPersonalised
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-500 hover:bg-violet-100 hover:text-violet-700',
            )}
          >
            <PersonIcon />
            {'Personal Mode'}
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
      <div className={classNames('w-full space-y-12 relative', className)}>
        {/* // Search input */}
        <section className={`space-y-6 ${fadeStyle(0, true)}`}>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-600 mb-1">Find media semantically</h2>
          </div>

          <div className="relative max-w-3xl mx-auto">
            <MagnifyingGlassIcon className="absolute z-10 left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-violet-400" />
            <input
              type="text"
              placeholder="Search stories by feelings, not just words..."
              value={query}
              ref={searchInputRef}
              onChange={(e) => setQuery(e.target.value)}
              className={classNames(
                'w-full pl-16 pr-8 py-4 text-lg text-gray-900',
                'bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 rounded-2xl shadow-lg',
                'focus:border-violet-400 focus:ring-0 focus:outline-none',
                'focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all duration-300',
                'placeholder:text-gray-400 placeholder:font-light',
              )}
            />
            <Button
              onClick={() => setQuery('')}
              className="absolute z-10 right-6 top-1/2 transform -translate-y-1/2 rounded-full p-1 cursor-pointer hover:bg-violet-100 transition-colors duration-200"
            >
              <Cross2Icon className="w-6 h-6 text-violet-400" />
            </Button>
          </div>
        </section>

        {/* Suggestions */}
        {!searchQuery.isLoading && !searchQuery.data && (
          <section className={`flex flex-col items-center relative space-y-3`}>
            <h2 className={`text-xl font-light text-gray-600 ${fadeStyle(1, true, 700, 3)}`}>
              {'Or just explore'}
            </h2>
            <div
              className={classNames(
                `flex w-full justify-start align-center flex-col pt-2`,
                'sticky top-0 z-2 bg-[#f7f7fb]/100 backdrop-blur-sm',
                fadeStyle(2),
              )}
            >
              <div className={classNames('flex items-center space-x-3 w-full px-6 pb-2')}>
                <h2 className="text-xl font-semibold text-gray-600">{'Explore'}</h2>
                <Button
                  onClick={() => setShowMoodPanel(!showMoodPanel)}
                  variant="soft"
                  className={classNames(
                    'px-4 py-1 rounded-full cursor-pointer',
                    'text-violet-600 hover:bg-violet-400 hover:text-white',
                    'hover:shadow-sm transition-all duration-200 ease-out',
                    'text-sm',
                    'flex items-center gap-2',
                    showMoodPanel && 'bg-violet-200 border-violet-200',
                  )}
                >
                  {/* <SliderIcon className="w-3.5 h-3.5" /> */}
                  <span>{'Mood'}</span>

                  {Object.values(sliderValues).some((value) => value !== 0) ? (
                    <div
                      className={classNames(
                        'px-2 text-violet-500 text-xs',
                        'transition-opacity duration-100 ease-out',
                        'h-full flex items-center',
                        // showMoodPanel ? 'opacity-0' : 'opacity-100',
                      )}
                    >
                      {Object.entries(sliderValues)
                        .filter(([key, value]) => value !== 0)
                        .map(([key, value]) => {
                          const slider = sliders.find((s) => s.key === key)
                          if (!slider) return null
                          const direction = value > 0 ? slider.rightLabel : slider.label
                          const intensity = Math.abs(value)
                          // Clamp font weight between 400 and 900
                          const fontWeight = 400 + Math.round(intensity * 500)
                          return (
                            <span
                              key={key}
                              style={{ fontWeight, transition: 'font-weight 0.2s' }}
                              className="mr-2 text-gray-500 text-xs"
                            >
                              {direction}
                            </span>
                          )
                        })}
                      <Button
                        variant="soft"
                        className="cursor-pointer rounded-full p-1 ml-2 text-violet-500 hover:bg-violet-200 hover:text-violet-700"
                        aria-label="Reset mood sliders"
                        title="Reset mood sliders"
                        onClick={() =>
                          setSliderValues({
                            adventure: 0,
                            romance: 0,
                            complexity: 0,
                            emotion: 0,
                            realism: 0,
                          })
                        }
                      >
                        <Cross2Icon className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      style={{ transition: 'font-weight 0.2s' }}
                      className="mr-2 text-gray-500 text-xs"
                    >
                      {'Neutral'}
                    </span>
                  )}

                  <ChevronDownIcon
                    className={classNames(
                      'w-3 h-3 transition-transform duration-200',
                      showMoodPanel ? 'rotate-180' : 'rotate-0',
                    )}
                  />
                </Button>

                {suggestions.isFetching && (
                  <ReloadIcon className="inline-block animate-spin ml-4 w-4 h-4 text-violet-500" />
                )}
                <div className="flex flex-1 justify-end w-full">
                  <Button
                    variant="soft"
                    className="px-4 py-2 rounded-full cursor-pointer text-violet-600 hover:bg-violet-400 hover:text-white hover:shadow-sm transition-all duration-200 ease-out"
                    aria-label="Search"
                    title="Search"
                    onClick={() => {
                      document.body.scrollIntoView({ behavior: 'smooth' })
                      setTimeout(() => searchInputRef.current?.focus(), 600)
                      setShowMoodPanel(false)
                    }}
                  >
                    <MagnifyingGlassIcon className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              <div
                className={classNames(
                  'transition-all duration-500 ease-out',
                  'max-h-[400px] opacity-100 transform translate-y-0',
                  'bg-violet-50/80 backdrop-blur-sm',
                  'mt-2 py-2 px-6',
                  'shadow-[inset_0_2px_16px_0_rgba(80,60,100,0.10)]',
                  showMoodPanel ? '' : 'max-h-0 opacity-0 transform -translate-y-2 my-0 py-0',
                )}
              >
                <div className="text-center flex space-y-2 flex-col items-start">
                  {/* <h3 className="text-sm font-medium text-gray-700">{'Fine-tune your vibe'}</h3> */}
                  <h4 className="text-xs text-gray-500 mt-2">
                    Adjust the sliders to match your current mood
                  </h4>
                  <div className="flex items-center w-full mt-2">
                    <Button
                      variant="soft"
                      className={classNames(
                        'px-4 py-1 rounded-full cursor-pointer',
                        'text-violet-600 hover:bg-violet-400 hover:text-white',
                        'hover:shadow-sm transition-all duration-200 ease-out',
                        'text-sm',
                      )}
                      onClick={() => {
                        setSliderValues({
                          adventure: Math.round(Math.random() * 20 - 10) / 10,
                          romance: Math.round(Math.random() * 20 - 10) / 10,
                          complexity: Math.round(Math.random() * 20 - 10) / 10,
                          emotion: Math.round(Math.random() * 20 - 10) / 10,
                          realism: Math.round(Math.random() * 20 - 10) / 10,
                        })
                      }}
                    >
                      {'🎲 Surprise me'}
                    </Button>
                    {Object.values(sliderValues).some((value) => value !== 0) ? (
                      <Button
                        variant="soft"
                        className={classNames(
                          'flex items-center px-4 py-1 rounded-full cursor-pointer',
                          'text-violet-600 hover:bg-violet-400 hover:text-white',
                          'hover:shadow-sm transition-all duration-200 ease-out',
                          'text-sm',
                        )}
                        onClick={() => {
                          setSliderValues({
                            adventure: 0,
                            romance: 0,
                            complexity: 0,
                            emotion: 0,
                            realism: 0,
                          })
                        }}
                      >
                        <Cross2Icon className="w-3 h-3 mr-1" />
                        {'Reset'}
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div
                  className={classNames('flex flex-wrap gap-2 mt-4', showMoodPanel ? 'mt-4' : '')}
                >
                  {sliders.map((slider) => (
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
              </div>
            </div>

            {/* Personalised Carousel Section */}
            {/* <div className="space-y-6">
                {suggestions.isLoading ? (
                  <div className="space-y-8">
                    <div className="text-center pt-4 pb-6">
                      <ReloadIcon className="inline-block animate-spin w-8 h-8 text-violet-500 mb-4" />
                      <p className="text-gray-600 text-lg font-medium flex items-center justify-center gap-2">
                        <PersonIcon className="w-5 h-5" />
                        Creating your personalized recommendations...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-left px-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">For You</h3>
                      <p className="text-sm text-gray-500">
                        Based on your viewing history and preferences
                      </p>
                    </div>
                    <div className="overflow-x-auto pb-4">
                      <div className="flex gap-4 px-6 min-w-max">
                        {suggestions.data?.results.map((movie: Movie) => (
                          <div key={movie.id} className="flex-shrink-0 w-48">
                            <MovieCard
                              movie={movie}
                              onClick={() => setSelectedMovie(movie)}
                              compact
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div> */}
            <>
              <div className={`${fadeStyle(2)}`}>
                {suggestions.isLoading ? (
                  <div className="space-y-8">
                    <div className="text-center pt-4 pb-6">
                      <ReloadIcon className="inline-block animate-spin w-8 h-8 text-violet-500 mb-4" />
                      <p className="text-gray-600 text-lg font-medium flex items-center justify-center gap-2">
                        <MagnifyingGlassIcon className="w-5 h-5" />
                        Zoeken naar perfecte matches...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 ${visibleSections.includes(2) ? 'animate-fade-in' : 'hidden'}`}
                  >
                    {suggestions.data?.results.map((movie: Movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={() => setSelectedMovie(movie)}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          </section>
        )}

        {/* Search results */}
        <section className={`flex flex-col px-6 relative space-y-3`}>
          {searchQuery.isLoading ? (
            <div className="space-y-8">
              <div className="text-center pt-4 pb-6">
                <ReloadIcon className="inline-block animate-spin w-8 h-8 text-violet-500 mb-4" />
                <p className="text-gray-600 text-lg font-medium flex items-center justify-center gap-2">
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  Zoeken naar perfecte matches...
                </p>
              </div>
            </div>
          ) : searchQuery.data ? (
            <>
              <h2 className="text-xl font-semibold text-gray-600 animate-fade-in">
                {'Semantic search results'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 animate-fade-in">
                {searchQuery.data?.map((movie: Movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => setSelectedMovie(movie)}
                    compact
                  />
                ))}
              </div>
            </>
          ) : null}
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
