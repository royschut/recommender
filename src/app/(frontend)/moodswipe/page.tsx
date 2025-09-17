'use client'
import React, { useEffect } from 'react'
import Image from 'next/image'
import phoneImage from './assets/phone.png'
import { SwipeContainer } from './components/SwipeContainer'
import { SwipeIndicator } from './components/SwipeIndicator'
import { ArrowKey } from './components/ArrowKey'
import { MovieCard } from './components/MovieCard'
import { MovieMiniatures } from './components/MovieMiniatures'
import { useMovies } from './hooks/useMovies'
import { useSwipeIndex } from './hooks/useSwipeIndex'
import { useDragListeners } from './hooks/useDragListeners'
import { Movie } from './Movie'
import { useKeyListeners } from './hooks/useKeyListeners'

export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

const MoodSwipe = () => {
  const {
    data,
    moods,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    onUserAction,
    userProfile,
  } = useMovies()
  const movies: Movie[] = data?.pages?.flatMap((page: { results: Movie[] }) => page.results) ?? []

  const { xIndex, yIndex, handleSwipe, movieColumns } = useSwipeIndex(movies, onUserAction)
  useKeyListeners(handleSwipe)

  const { verticalDragOffset, horizontalDragOffset, swipeDirection, dragHandlers } =
    useDragListeners(handleSwipe)

  // No swipe feedback for like/dislike anymore - only vertical navigation
  const swipeIntensity = Math.min(Math.abs(verticalDragOffset) / 120, 1) // Max at 120px
  const isLiking = false // No horizontal swipe feedback
  const isDisliking = false // No horizontal swipe feedback

  const movie = movieColumns[0]?.[yIndex]

  // Get all movies for miniatures component
  const allMovies = data?.pages?.flatMap((page) => page.results) ?? []

  // Handle like/dislike actions
  const handleLike = () => {
    const currentMovie = movieColumns[0][yIndex]
    if (currentMovie && onUserAction) {
      onUserAction(String(currentMovie.id), 'like')
    }
    // Move to next movie
    if (yIndex < movieColumns[0].length - 1) {
      handleSwipe('down')
    }
  }

  const handleDislike = () => {
    const currentMovie = movieColumns[0][yIndex]
    if (currentMovie && onUserAction) {
      onUserAction(String(currentMovie.id), 'dislike')
    }
    // Move to next movie
    if (yIndex < movieColumns[0].length - 1) {
      handleSwipe('down')
    }
  }

  useEffect(() => {
    if (!movie) return

    // Load more movies when we're getting close to the end
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

  const main = () => {
    type MoodShape = { title?: string; description?: string; score?: number }
    const moodList: MoodShape[] = Array.isArray(moods) ? (moods as MoodShape[]) : []

    const topMoods = moodList
      .slice()
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 3)

    return (
      <>
        {/* Miniature liked/disliked movies at the top */}
        <MovieMiniatures userProfile={userProfile} allMovies={allMovies} />

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

        {/* Top mood chips */}
        {topMoods.length > 0 && (
          <div className="px-4 pt-4 absolute top-20 flex-col gap-2 flex overflow-x-auto space-x-2 z-10">
            {topMoods.map((mood, idx) => (
              <div
                key={mood.title ?? idx}
                className="inline-flex items-center space-x-2 rounded-full bg-white/6 py-1.5 px-3 text-sm text-white/90"
                title={mood.description}
              >
                <span className="font-medium">{mood.title ?? 'Unknown'}</span>
                <span className="text-xs text-white/60">
                  {Math.round((mood.score ?? 0) * 100) / 100}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Swipe Feedback Overlay - for like/dislike gestures */}
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

        {/* Like/Dislike buttons */}
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex space-x-8 z-30">
          <button
            onClick={handleDislike}
            className="bg-red-500/20 hover:bg-red-500/30 border-2 border-red-400/50 hover:border-red-400 rounded-full p-4 transition-all duration-200 backdrop-blur-sm"
          >
            <div className="w-8 h-8 flex items-center justify-center text-3xl">👎</div>
          </button>
          <button
            onClick={handleLike}
            className="bg-green-500/20 hover:bg-green-500/30 border-2 border-green-400/50 hover:border-green-400 rounded-full p-4 transition-all duration-200 backdrop-blur-sm"
          >
            <div className="w-8 h-8 flex items-center justify-center text-3xl">👍</div>
          </button>
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

            {/* Like/Dislike buttons for desktop */}
            <div className="flex space-x-4">
              <button
                onClick={handleDislike}
                className="bg-red-500/20 hover:bg-red-500/30 border-2 border-red-400/50 hover:border-red-400 rounded-full p-3 transition-all duration-200"
              >
                <div className="w-6 h-6 flex items-center justify-center text-xl">👎</div>
              </button>
              <button
                onClick={handleLike}
                className="bg-green-500/20 hover:bg-green-500/30 border-2 border-green-400/50 hover:border-green-400 rounded-full p-3 transition-all duration-200"
              >
                <div className="w-6 h-6 flex items-center justify-center text-xl">👍</div>
              </button>
            </div>

            <ArrowKey
              direction="down"
              onClick={() => handleSwipe('down')}
              disabled={yIndex >= movieColumns[0]?.length - 1}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MoodSwipe
