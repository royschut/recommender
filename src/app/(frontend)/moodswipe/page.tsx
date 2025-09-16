'use client'
import React, { useEffect } from 'react'
import Image from 'next/image'
import phoneImage from './assets/phone.png'
import { SwipeContainer } from './components/SwipeContainer'
import { SwipeIndicator } from './components/SwipeIndicator'
import { ArrowKey } from './components/ArrowKey'
import { MovieCard } from './components/MovieCard'
import { useMovies } from './hooks/useMovies'
import { useSwipeIndex } from './hooks/useSwipeIndex'
import { useKeyListeners } from './hooks/useKeyListeners'
import { useDragListeners } from './hooks/useDragListeners'
import { Movie } from './Movie'

export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

const MoodSwipe = () => {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMovies()
  const movies: Movie[] = data?.pages?.flatMap((page: { results: Movie[] }) => page.results) ?? []

  const { xIndex, yIndex, handleSwipe, movieColumns } = useSwipeIndex(movies)
  useKeyListeners(handleSwipe)
  const { verticalDragOffset, horizontalDragOffset, swipeDirection, dragHandlers } =
    useDragListeners(handleSwipe)

  // Determine swipe feedback based on swipeDirection and drag intensity
  const swipeIntensity = Math.min(Math.abs(horizontalDragOffset) / 120, 1) // Max at 120px
  const isLiking = swipeDirection === 'right' && Math.abs(horizontalDragOffset) > 30
  const isDisliking = swipeDirection === 'left' && Math.abs(horizontalDragOffset) > 30

  const movie = movieColumns[xIndex]?.[yIndex]

  // Load more movies when we're getting close to the end
  useEffect(() => {
    if (xIndex !== 1) return
    if (yIndex >= movies.length - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [
    xIndex,
    yIndex,
    movies.length,
    movieColumns.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ])

  if (isLoading || !movies || movies.length === 0) {
    return <div>Loading...</div>
  }

  console.log({ movieColumns, xIndex, yIndex, sugg: movie?.moodSuggestions })

  const main = () => {
    return (
      <>
        <div {...dragHandlers} className="absolute inset-0">
          <SwipeContainer
            movieColumns={movieColumns}
            currentVerticalIndex={yIndex}
            currentHorizontalIndex={xIndex}
            verticalDragOffset={verticalDragOffset}
            horizontalDragOffset={horizontalDragOffset}
            renderItem={(movie: Movie, isActive: boolean) => (
              <MovieCard movie={movie} isActive={isActive} isSwipping={Boolean(swipeDirection)} />
            )}
          />
        </div>

        {/* Swipe Feedback Overlay - only during horizontal swipe */}
        {(isLiking || isDisliking) && (
          <div className="pointer-events-none absolute inset-0 z-20">
            <div
              className={`absolute inset-0 transition-all duration-200 ${
                isLiking ? 'bg-green-600/15' : isDisliking ? 'bg-red-600/15' : 'bg-transparent'
              }`}
              style={{ opacity: swipeIntensity * 0.4 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`transform transition-all duration-200 ${
                  isLiking ? 'text-green-400' : 'text-red-400'
                }`}
                style={{
                  transform: `scale(${1 + swipeIntensity * 0.5})`,
                  opacity: swipeIntensity,
                }}
              >
                <div className="text-8xl drop-shadow-2xl">{isLiking ? '👍' : '👎'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Indicators - hidden during horizontal swipe feedback */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            !swipeDirection || (swipeDirection !== 'left' && swipeDirection !== 'right')
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        >
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <SwipeIndicator
              direction="down"
              icon={
                <div className="w-7 h-7 border-2 border-white/70 rounded flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white/70 rounded-full" />
                </div>
              }
              label={'Explore'}
            />
          </div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <SwipeIndicator
              direction="left"
              icon={<div className="w-8 h-8 flex items-center justify-center text-2xl">👎</div>}
              label="Not interesting"
            />
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <SwipeIndicator
              direction="right"
              icon={<div className="w-8 h-8 flex items-center justify-center text-2xl">👍</div>}
              label="Like"
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="bg-gray-900">
      {/* Mobile: fullscreen */}
      <div className="md:hidden relative min-h-dvh">{main()}</div>

      {/* Desktop: phone mock + arrow keys */}
      <div className="hidden md:flex justify-center items-center min-h-screen p-8">
        <div className="flex items-center space-x-8">
          <div className="relative">
            <Image
              src={phoneImage}
              alt="Phone mockup"
              width={390}
              height={844}
              className="block"
              priority
            />
            <div className="absolute inset-[15px] bg-black rounded-[25px] overflow-hidden">
              {main()}
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <ArrowKey direction="up" onClick={() => handleSwipe('up')} disabled={yIndex <= 0} />
            <div className="flex space-x-4">
              <ArrowKey direction="left" onClick={() => handleSwipe('left')} disabled={false} />
              <ArrowKey direction="right" onClick={() => handleSwipe('right')} disabled={false} />
            </div>
            <ArrowKey
              direction="down"
              onClick={() => handleSwipe('down')}
              disabled={yIndex >= movieColumns[xIndex]?.length - 1}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MoodSwipe
