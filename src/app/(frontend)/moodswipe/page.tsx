'use client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import React from 'react'
import Image from 'next/image'
import phoneImage from './assets/phone.png'
import { Movie } from '../playground/components/MovieCard'
import { SwipeContainer } from './components/SwipeContainer'
import { SwipeIndicator } from './components/SwipeIndicator'
import { ArrowKey } from './components/ArrowKey'
import { useSwipeIndex } from './hooks/useSwipeIndex'

const MoodSwipe = () => {
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
  const { xIndex, yIndex, setIndex, handleSwipe, movieColumns } = useSwipeIndex({
    movies: movies || [],
  })

  if (!movies || movies.length === 0) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 p-8">
      <div className="flex items-center space-x-8">
        <div className="relative">
          <Image src={phoneImage} alt="Phone mockup" width={390} height={844} className="block" />
          <div className="absolute inset-[15px] bg-black rounded-[25px] overflow-hidden">
            <SwipeContainer
              movieColumns={movieColumns}
              currentVerticalIndex={yIndex}
              currentHorizontalIndex={xIndex}
              onVerticalIndexChange={(newYIndex) => setIndex(xIndex, newYIndex)}
              onHorizontalIndexChange={(newXIndex) => setIndex(newXIndex, yIndex)}
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

        {/* Arrow Keys */}
        <div className="flex flex-col items-center space-y-4">
          <ArrowKey direction="up" onClick={() => handleSwipe('up')} disabled={yIndex <= 0} />
          <div className="flex space-x-4">
            <ArrowKey direction="left" onClick={() => handleSwipe('left')} disabled={xIndex <= 0} />
            <ArrowKey
              direction="right"
              onClick={() => handleSwipe('right')}
              disabled={xIndex >= movieColumns.length - 1}
            />
          </div>
          <ArrowKey
            direction="down"
            onClick={() => handleSwipe('down')}
            disabled={yIndex >= movieColumns[xIndex]?.length - 1}
          />
        </div>
      </div>
    </div>
  )
}

export default MoodSwipe
