'use client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import React from 'react'
import Image from 'next/image'
import phoneImage from './assets/phone.png'
import { Movie } from '../playground/components/MovieCard'
import { SwipeContainer } from './components/SwipeContainer'
import { SwipeIndicator } from './components/SwipeIndicator'

const MoodSwipe = () => {
  const [currentVerticalIndex, setCurrentVerticalIndex] = React.useState(0)
  const [currentHorizontalIndex, setCurrentHorizontalIndex] = React.useState(1)
  const [isSwipping, setIsSwipping] = React.useState(false)

  const suggestions = useQuery({
    queryKey: ['suggestions'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      return fetch('/api/moodswipe', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).then((res) => res.json())
    },
  })

  const movies = suggestions.data?.results as Movie[]

  // Split movies into 3 arrays of 20 each
  const movieColumns = React.useMemo(() => {
    if (!movies || movies.length === 0) return [[], [], []]

    const leftColumn = movies.slice(0, 20)
    const centerColumn = movies.slice(20, 40)
    const rightColumn = movies.slice(40, 60)

    return [leftColumn, centerColumn, rightColumn]
  }, [movies])

  if (!movies || movies.length === 0) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-8">
      <div className="relative">
        <Image src={phoneImage} alt="Phone mockup" width={390} height={844} className="block" />
        <div className="absolute inset-[15px] bg-black rounded-[25px] overflow-hidden">
          <SwipeContainer
            movieColumns={movieColumns}
            currentVerticalIndex={currentVerticalIndex}
            currentHorizontalIndex={currentHorizontalIndex}
            onVerticalIndexChange={setCurrentVerticalIndex}
            onHorizontalIndexChange={setCurrentHorizontalIndex}
            onSwipeStateChange={setIsSwipping}
            renderItem={(movie: Movie, index: number, isActive: boolean) => (
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
            )}
          />

          <div
            className={`transition-opacity duration-300 ${!isSwipping ? 'opacity-100' : 'opacity-0'}`}
          >
            <SwipeIndicator
              direction="down"
              icon={
                <div className="w-6 h-6 border-2 border-white/70 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                </div>
              }
              label="Explore"
            />
            <SwipeIndicator
              direction="left"
              icon={<span className="text-xl">❤️</span>}
              label="Romance"
            />
            <SwipeIndicator
              direction="right"
              icon={<span className="text-xl">🧸</span>}
              label="Kid Friendly"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MoodSwipe
