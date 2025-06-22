'use client'

import React, { useState, useEffect } from 'react'
import {
  HeartIcon,
  PlusIcon,
  Cross2Icon,
  VideoIcon,
  StarFilledIcon,
  CalendarIcon,
} from '@radix-ui/react-icons'
import { cn } from '../utils/cn'
import Card from './ui/Card'
import Button from './ui/Button'
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

interface PersonalTabProps {
  className?: string
}

const PersonalTab: React.FC<PersonalTabProps> = ({ className }) => {
  const [favorites, setFavorites] = useState<Movie[]>([])
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [exploreItems, setExploreItems] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  // Fetch initial favorites (3 random items)
  useEffect(() => {
    const fetchInitialFavorites = async () => {
      setLoadingFavorites(true)

      // Always start with mock data for reliable favorites
      const mockFavorites = [
        {
          id: 'fav-1',
          title: 'Inception',
          image: '/api/placeholder/300/450',
          voteAverage: 8.8,
          releaseDate: '2010-07-16',
          genres: ['Sci-Fi', 'Thriller'],
          overview: 'A mind-bending thriller about dream manipulation',
        },
        {
          id: 'fav-2',
          title: 'The Dark Knight',
          image: '/api/placeholder/300/450',
          voteAverage: 9.0,
          releaseDate: '2008-07-18',
          genres: ['Action', 'Crime'],
          overview: 'Batman faces his greatest challenge yet',
        },
        {
          id: 'fav-3',
          title: 'Interstellar',
          image: '/api/placeholder/300/450',
          voteAverage: 8.6,
          releaseDate: '2014-11-07',
          genres: ['Sci-Fi', 'Drama'],
          overview: 'A journey through space and time to save humanity',
        },
      ]

      try {
        const response = await fetch('/api/explore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 3 }),
        })

        if (response.ok) {
          const data = await response.json()
          setFavorites(data.results?.slice(0, 3) || mockFavorites)
        } else {
          setFavorites(mockFavorites)
        }
      } catch (error) {
        console.error('Failed to fetch initial favorites:', error)
        setFavorites(mockFavorites)
      } finally {
        setLoadingFavorites(false)
      }
    }

    fetchInitialFavorites()
  }, [])

  // Fetch personal recommendations based on favorites
  useEffect(() => {
    if (favorites.length === 0) return

    const fetchRecommendations = async () => {
      setLoadingRecommendations(true)

      // Mock recommendations that always work
      const mockRecommendations = Array.from({ length: 12 }, (_, i) => ({
        id: `rec-${i + 1}`,
        title:
          [
            'Blade Runner 2049',
            'Dune',
            'The Matrix',
            'Mad Max: Fury Road',
            'Ex Machina',
            'Arrival',
            'Prisoners',
            'Sicario',
            'The Prestige',
            'Memento',
            'Tenet',
            'Dunkirk',
          ][i] || `Recommended Movie ${i + 1}`,
        image: '/api/placeholder/300/450',
        voteAverage: 7 + Math.random() * 2,
        releaseDate: `${2020 + Math.floor(Math.random() * 4)}-01-01`,
        genres: [
          ['Sci-Fi', 'Thriller'],
          ['Adventure', 'Sci-Fi'],
          ['Action', 'Sci-Fi'],
          ['Action', 'Adventure'],
          ['Sci-Fi', 'Drama'],
          ['Drama', 'Sci-Fi'],
          ['Crime', 'Drama'],
          ['Action', 'Crime'],
          ['Mystery', 'Drama'],
          ['Mystery', 'Thriller'],
          ['Action', 'Thriller'],
          ['War', 'Drama'],
        ][i] || ['Drama', 'Action'],
        overview: 'Een film die perfect past bij jouw smaak',
      }))

      try {
        const response = await fetch('/api/personal-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            favoriteIds: favorites.map((f) => f.id),
            limit: 12,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setRecommendations(data.recommendations || mockRecommendations)
        } else {
          setRecommendations(mockRecommendations)
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error)
        setRecommendations(mockRecommendations)
      } finally {
        setLoadingRecommendations(false)
      }
    }

    fetchRecommendations()
  }, [favorites])

  const handleAddFavorite = async () => {
    setShowAddModal(true)
    try {
      const response = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 }),
      })

      if (response.ok) {
        const data = await response.json()
        setExploreItems(data.results || [])
      }
    } catch (error) {
      console.error('Failed to fetch explore items:', error)
      // Mock data fallback
      setExploreItems(
        Array.from({ length: 20 }, (_, i) => ({
          id: `explore-${i + 1}`,
          title: `Explore Movie ${i + 1}`,
          image: '/api/placeholder/300/450',
          voteAverage: 6 + Math.random() * 3,
          releaseDate: `${2018 + Math.floor(Math.random() * 6)}-01-01`,
          genres: ['Comedy', 'Romance'],
        })),
      )
    }
  }

  const addToFavorites = (movie: Movie) => {
    if (!favorites.find((f) => f.id === movie.id)) {
      setFavorites([...favorites, movie])
    }
    setShowAddModal(false)
  }

  const removeFavorite = (movieId: string) => {
    setFavorites(favorites.filter((f) => f.id !== movieId))
  }

  return (
    <div className={cn('w-full space-y-12', className)}>
      <p className="text-xs text-center text-gray-400 mt-4 font-light tracking-wide uppercase">
        Bouw je persoonlijke smaakprofiel en ontdek perfecte aanbevelingen
      </p>

      {/* Favorites Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <HeartIcon className="w-6 h-6 text-red-500" />
            Mijn Favorieten
          </h2>
          <Button variant="outline" onClick={handleAddFavorite} className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Voeg toe
          </Button>
        </div>

        {/* Favorites Carousel */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {loadingFavorites
            ? Array.from({ length: 3 }, (_, i) => <FavoriteCardSkeleton key={i} />)
            : favorites.map((movie) => (
                <FavoriteCard
                  key={movie.id}
                  movie={movie}
                  onRemove={() => removeFavorite(movie.id)}
                  onClick={() => setSelectedMovie(movie)}
                />
              ))}
        </div>
      </div>

      {/* Personal Recommendations */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Persoonlijke Aanbevelingen</h2>

        {loadingRecommendations ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }, (_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 animate-fade-in">
            {recommendations.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onClick={() => setSelectedMovie(movie)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <HeartIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <p className="text-gray-500 text-lg">
              Voeg favorieten toe om persoonlijke aanbevelingen te krijgen
            </p>
          </div>
        )}
      </div>

      {/* Add Favorites Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Voeg favorieten toe</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {exploreItems.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => addToFavorites(movie)}
                    compact
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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

// Favorite Card Component
interface FavoriteCardProps {
  movie: Movie
  onRemove: () => void
  onClick: () => void
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({ movie, onRemove, onClick }) => {
  const getPosterUrl = () => {
    return movie.image || movie.poster_path || movie.posterUrl
  }

  return (
    <div className="relative flex-shrink-0 w-48">
      <Card
        variant="default"
        padding="none"
        className="overflow-hidden cursor-pointer transition-all duration-200 ease-out group hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] rounded-2xl"
        onClick={onClick}
      >
        <div className="relative aspect-[3/4] bg-gradient-to-br from-violet-50 via-gray-50 to-indigo-50">
          {getPosterUrl() ? (
            <img
              src={getPosterUrl()}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoIcon className="w-12 h-12 text-violet-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{movie.title}</h3>
        </div>
      </Card>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
      >
        <Cross2Icon className="w-3 h-3" />
      </button>

      {/* Heart Icon */}
      <div className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
        <HeartIcon className="w-3 h-3 fill-current" />
      </div>
    </div>
  )
}

// Favorite Card Skeleton
const FavoriteCardSkeleton: React.FC = () => {
  return (
    <div className="flex-shrink-0 w-48">
      <Card variant="default" padding="none" className="overflow-hidden animate-pulse rounded-2xl">
        <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200"></div>
        <div className="p-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    </div>
  )
}

// Movie Card Component (reusable for recommendations and explore)
interface MovieCardProps {
  movie: Movie
  onClick: () => void
  compact?: boolean
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, compact = false }) => {
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

  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'overflow-hidden cursor-pointer transition-all duration-200 ease-out group',
        'hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01]',
        'rounded-2xl border-0 bg-white shadow-sm',
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[4/5] bg-gradient-to-br from-violet-50 via-gray-50 to-indigo-50 overflow-hidden">
        {getPosterUrl() ? (
          <img
            src={getPosterUrl()}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoIcon className="w-16 h-16 text-violet-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      {!compact && (
        <div className="p-3 space-y-1.5">
          <div className="space-y-0.5">
            <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 group-hover:text-violet-600 transition-colors duration-200">
              {movie.title}
            </h3>
            {getReleaseYear() && (
              <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-gray-400" />
                  {getReleaseYear()}
                </div>
                {getRating() && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <StarFilledIcon className="w-3 h-3 text-amber-400" />
                    <span className="text-xs">{getRating()?.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// Movie Card Skeleton
const MovieCardSkeleton: React.FC = () => {
  return (
    <Card variant="default" padding="none" className="overflow-hidden animate-pulse rounded-2xl">
      <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200"></div>
      <div className="p-3 space-y-1.5">
        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    </Card>
  )
}

export default PersonalTab
