'use client'
import React from 'react'
import Image from 'next/image'
import { Movie } from '../Movie'

interface UserAction {
  movieId: string
  action: 'like' | 'dislike'
}

interface MovieMiniaturesProps {
  userProfile: UserAction[]
  allMovies: Movie[]
}

export const MovieMiniatures: React.FC<MovieMiniaturesProps> = ({ userProfile, allMovies }) => {
  // Get liked and disliked movies from userProfile
  const likedMovieIds = userProfile
    .filter((action) => action.action === 'like')
    .map((action) => action.movieId)
  const dislikedMovieIds = userProfile
    .filter((action) => action.action === 'dislike')
    .map((action) => action.movieId)

  // Show max 5, most recent right (bovenop)
  const likedMovies = likedMovieIds
    .slice(-5)
    .map((id) => allMovies.find((movie) => String(movie.id) === id))
    .filter(Boolean) as Movie[]
  const dislikedMovies = dislikedMovieIds
    .slice(-5)
    .map((id) => allMovies.find((movie) => String(movie.id) === id))
    .filter(Boolean) as Movie[]
  const likedOverflow = likedMovieIds.length - 5
  const dislikedOverflow = dislikedMovieIds.length - 5

  // Don't render if no movies to show
  if (likedMovieIds.length === 0 && dislikedMovieIds.length === 0) {
    return null
  }

  return (
    <div className="absolute top-4 left-4 right-4 z-40 flex justify-between">
      {/* Liked movies miniatures */}
      {likedMovies.length > 0 && (
        <div className="flex -space-x-4 relative items-end">
          {likedMovies.map((movie, index) => (
            <div
              key={`liked-${movie.id}-${index}`}
              className="w-8 h-12 rounded overflow-hidden bg-gray-800 relative shadow-[0_2px_8px_rgba(0,255,120,0.10)]"
              style={{ zIndex: 100 + index, marginLeft: index === 0 ? 0 : '-0.3rem' }}
            >
              {movie.poster_path || movie.image || movie.posterUrl ? (
                <Image
                  src={movie.poster_path || movie.image || movie.posterUrl || ''}
                  alt={movie.title}
                  width={32}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                  ?
                </div>
              )}
            </div>
          ))}
          {likedOverflow > 0 && (
            <span className="ml-2 text-xs px-2 py-1 rounded bg-green-900/60 text-green-200 font-semibold shadow">
              +{likedOverflow}
            </span>
          )}
        </div>
      )}

      {/* Disliked movies miniatures */}
      {dislikedMovies.length > 0 && (
        <div className="flex -space-x-4 relative items-end justify-end">
          {dislikedMovies.map((movie, index) => (
            <div
              key={`disliked-${movie.id}-${index}`}
              className="w-8 h-12 rounded overflow-hidden bg-gray-800 relative"
              style={{ zIndex: 100 + index, marginLeft: index === 0 ? 0 : '-0.3rem' }}
            >
              {movie.poster_path || movie.image || movie.posterUrl ? (
                <Image
                  src={movie.poster_path || movie.image || movie.posterUrl || ''}
                  alt={movie.title}
                  width={32}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                  ?
                </div>
              )}
              {/* Subtle dislike overlay */}
              <div className="absolute inset-0 bg-red-900/30 rounded"></div>
            </div>
          ))}
          {dislikedOverflow > 0 && (
            <span className="ml-2 text-xs px-2 py-1 rounded bg-red-900/60 text-red-200 font-semibold shadow">
              +{dislikedOverflow}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
