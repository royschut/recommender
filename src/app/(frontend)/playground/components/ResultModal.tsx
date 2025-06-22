'use client'

import React, { useState, useEffect } from 'react'
import { Dialog } from 'radix-ui'
import {
  Cross2Icon,
  StarFilledIcon,
  CalendarIcon,
  ClockIcon,
  VideoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@radix-ui/react-icons'
import { cn } from '../utils/cn'
import Card from './ui/Card'
import Snackbar from './ui/Snackbar'

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
  runtime?: number
  director?: string
  cast?: string[]
}

interface ResultModalProps {
  movie: Movie | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMovieChange?: (movie: Movie) => void
}

const ResultModal: React.FC<ResultModalProps> = ({ movie, open, onOpenChange, onMovieChange }) => {
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [showRecommendationsSnackbar, setShowRecommendationsSnackbar] = useState(false)
  const [hasShownRecommendationsSnackbar, setHasShownRecommendationsSnackbar] = useState(false)

  // Function to handle movie change within modal
  const handleMovieChange = (newMovie: Movie) => {
    if (onMovieChange) {
      onMovieChange(newMovie)
    }
    // Reset scroll position when changing movies
    setScrollPosition(0)
    const container = document.getElementById('recommendations-carousel')
    if (container) {
      container.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }

  // Fetch recommendations when movie changes
  useEffect(() => {
    if (!movie || !open) {
      setRecommendations([])
      return
    }

    const fetchRecommendations = async () => {
      setLoadingRecommendations(true)
      try {
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId: movie.id }),
        })

        if (response.ok) {
          const data = await response.json()
          setRecommendations(data.recommendations || [])
          
          // Show snackbar only for the first time recommendations are shown
          if (data.recommendations?.length > 0 && !hasShownRecommendationsSnackbar) {
            setShowRecommendationsSnackbar(true)
            setHasShownRecommendationsSnackbar(true)
          }
        }
      } catch (error) {
        console.error('Recommendations error:', error)
        // Mock data for demo
        setRecommendations([
          { id: '1', title: 'Gerelateerde Film 1', image: '/api/placeholder/300/450' },
          { id: '2', title: 'Gerelateerde Film 2', image: '/api/placeholder/300/450' },
          { id: '3', title: 'Gerelateerde Film 3', image: '/api/placeholder/300/450' },
          { id: '4', title: 'Gerelateerde Film 4', image: '/api/placeholder/300/450' },
          { id: '5', title: 'Gerelateerde Film 5', image: '/api/placeholder/300/450' },
          { id: '6', title: 'Gerelateerde Film 6', image: '/api/placeholder/300/450' },
        ])
      } finally {
        setLoadingRecommendations(false)
      }
    }

    fetchRecommendations()
  }, [movie, open])

  const scrollCarousel = (direction: 'left' | 'right') => {
    const container = document.getElementById('recommendations-carousel')
    if (!container) return

    const scrollAmount = 200
    const newPosition =
      direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount)

    container.scrollTo({ left: newPosition, behavior: 'smooth' })
    setScrollPosition(newPosition)
  }

  const getPosterUrl = () => {
    return movie?.image || movie?.poster_path || movie?.posterUrl
  }

  const getRating = () => {
    return movie?.voteAverage || movie?.vote_average
  }

  const getReleaseYear = () => {
    const date = movie?.releaseDate || movie?.release_date
    return date ? new Date(date).getFullYear() : null
  }

  const getGenres = () => {
    if (!movie?.genres) return []
    if (Array.isArray(movie.genres)) {
      if (movie.genres.length > 0 && typeof movie.genres[0] === 'object') {
        return (movie.genres as Array<{ genre: string }>).map((g) => g.genre)
      }
      return movie.genres as string[]
    }
    return []
  }

  const getDescription = () => {
    return movie?.description || movie?.overview
  }

  if (!movie) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in z-40" />
        <Dialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-4xl max-h-[90vh] overflow-y-auto',
            'bg-white rounded-2xl shadow-2xl z-50',
            'animate-fade-in',
          )}
        >
          <div className="relative">
            {/* Close Button */}
            <Dialog.Close
              className={cn(
                'absolute top-4 right-4 z-10',
                'w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm',
                'flex items-center justify-center text-gray-700',
                'hover:bg-white transition-colors duration-200 shadow-lg',
              )}
            >
              <Cross2Icon className="w-5 h-5" />
            </Dialog.Close>

            {/* Header Section - Movie Info */}
            <div className="flex gap-6 p-6 border-b border-gray-200">
              {/* Smaller Movie Poster */}
              <div className="flex-shrink-0">
                <div className="w-32 h-48 bg-gradient-to-br from-violet-50 via-gray-50 to-indigo-50 rounded-xl overflow-hidden shadow-lg">
                  {getPosterUrl() ? (
                    <img
                      src={getPosterUrl()}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoIcon className="w-12 h-12 text-violet-300" />
                    </div>
                  )}
                </div>
              </div>

              {/* Movie Metadata */}
              <div className="flex-1 space-y-4">
                <div>
                  <Dialog.Title className="text-2xl font-bold text-gray-900 mb-2">
                    {movie.title}
                  </Dialog.Title>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {getReleaseYear() && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {getReleaseYear()}
                      </div>
                    )}

                    {getRating() && (
                      <div className="flex items-center gap-1">
                        <StarFilledIcon className="w-4 h-4 text-amber-500" />
                        {getRating()?.toFixed(1)}
                      </div>
                    )}

                    {movie.runtime && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {movie.runtime} min
                      </div>
                    )}
                  </div>
                </div>

                {getGenres().length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getGenres().map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-violet-100 text-violet-700 text-sm rounded-full font-medium"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {getDescription() && (
                  <Dialog.Description className="text-gray-700 leading-relaxed text-sm">
                    {getDescription()}
                  </Dialog.Description>
                )}

                {movie.director && (
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900">Regisseur: </span>
                    <span className="text-gray-700">{movie.director}</span>
                  </div>
                )}

                {movie.cast && movie.cast.length > 0 && (
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900">Cast: </span>
                    <span className="text-gray-700">{movie.cast.slice(0, 3).join(', ')}</span>
                    {movie.cast.length > 3 && <span className="text-gray-500"> en anderen</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations Carousel */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Meer zoals dit</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollCarousel('left')}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    disabled={scrollPosition <= 0}
                  >
                    <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => scrollCarousel('right')}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {loadingRecommendations ? (
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block animate-spin w-8 h-8 border-2 border-violet-200 border-t-violet-500 rounded-full"></div>
                  <span className="ml-3 text-gray-600 font-medium">Aanbevelingen laden...</span>
                </div>
              ) : recommendations.length > 0 ? (
                <div
                  id="recommendations-carousel"
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {recommendations.map((rec) => (
                    <RecommendationCard 
                      key={rec.id} 
                      movie={rec} 
                      onClick={() => handleMovieChange(rec)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <VideoIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Geen aanbevelingen beschikbaar</p>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <Snackbar
        open={showRecommendationsSnackbar}
        onOpenChange={setShowRecommendationsSnackbar}
        message="Semantisch gerelateerde items worden automatisch gematcht"
        variant="info"
        icon={<VideoIcon className="w-5 h-5" />}
      />
    </Dialog.Root>
  )
}

interface RecommendationCardProps {
  movie: Movie
  onClick: () => void
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ movie, onClick }) => {
  const getPosterUrl = () => {
    return movie.image || movie.poster_path || movie.posterUrl
  }

  const getRating = () => {
    return movie.voteAverage || movie.vote_average
  }

  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'flex-shrink-0 w-36 cursor-pointer transition-all duration-300 group',
        'hover:shadow-xl hover:-translate-y-1 hover:scale-105',
        'rounded-xl overflow-hidden',
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] bg-gradient-to-br from-violet-50 via-gray-50 to-indigo-50">
        {getPosterUrl() ? (
          <img
            src={getPosterUrl()}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoIcon className="w-8 h-8 text-violet-300" />
          </div>
        )}

        {getRating() && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-1.5 py-0.5 rounded-md text-xs font-medium backdrop-blur-sm flex items-center gap-0.5">
            <StarFilledIcon className="w-2.5 h-2.5 text-amber-400" />
            {getRating()?.toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-3">
        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-violet-600 transition-colors">
          {movie.title}
        </h4>
        <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Klik om te bekijken
        </p>
      </div>
    </Card>
  )
}

export default ResultModal
