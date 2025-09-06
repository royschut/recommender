import React from 'react'
import { Movie } from '../../playground/components/MovieCard'

interface MovieCardProps {
  movie: Movie
  isActive: boolean
  isSwipping: boolean
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, isActive, isSwipping }) => {
  return (
    <>
      <img
        src={movie.posterUrl}
        alt={movie.title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
      {isActive && (
        <div
          className={`absolute bottom-0 left-0 right-0 text-white pointer-events-none transition-opacity duration-300 ${
            !isSwipping ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          <div className="relative px-4 py-3 mb-[60px]">
            <h2
              className="text-lg font-bold mb-1"
              style={{
                filter:
                  'drop-shadow(rgba(0,0,0,0.9) 1px 1px 2px) drop-shadow(rgba(0,0,0,0.7) 0px 0px 8px) drop-shadow(rgba(0,0,0,0.4) 0px 0px 20px)',
              }}
            >
              {movie.title}
            </h2>
            <p
              className="text-sm opacity-90 line-clamp-2"
              style={{
                filter:
                  'drop-shadow(rgba(0,0,0,0.9) 1px 1px 2px) drop-shadow(rgba(0,0,0,0.7) 0px 0px 8px) drop-shadow(rgba(0,0,0,0.4) 0px 0px 20px)',
              }}
            >
              {movie.overview?.substring(0, 80)}...
            </p>
          </div>
        </div>
      )}
    </>
  )
}
