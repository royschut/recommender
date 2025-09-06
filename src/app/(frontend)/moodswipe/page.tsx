'use client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import React from 'react'
import Image from 'next/image'
import phoneImage from './assets/phone.png'
import { Movie } from '../playground/components/MovieCard'
import { SwipeContainer } from './components/SwipeContainer'
import { SwipeIndicator } from './components/SwipeIndicator'
import { ArrowKey } from './components/ArrowKey'
import { MovieCard } from './components/MovieCard'
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
              renderItem={(movie: Movie, isActive: boolean) => (
                <MovieCard movie={movie} isActive={isActive} isSwipping={isSwipping} />
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
