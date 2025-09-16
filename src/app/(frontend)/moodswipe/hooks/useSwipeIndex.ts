import { useState, useMemo } from 'react'
import { SwipeDirection } from '../page'
import { Movie } from '../Movie'

export const useSwipeIndex = (
  movies: Movie[],
  onUserAction?: (movieId: string, action: 'like' | 'dislike') => void,
) => {
  const [yIndex, setYIndex] = useState(0)

  // Only use the main movie column - no horizontal navigation
  const movieColumns = useMemo(() => {
    if (!movies || movies.length === 0) return [[]]
    return [movies]
  }, [movies])

  const handleSwipe = (direction: SwipeDirection) => {
    const currentColumn = movieColumns[0]

    switch (direction) {
      case 'up':
        if (yIndex > 0) {
          setYIndex(yIndex - 1)
        }
        break
      case 'down':
        if (yIndex < currentColumn.length - 1) {
          setYIndex(yIndex + 1)
        }
        break
    }
  }

  return {
    xIndex: 0, // Always 0 since we only have one column
    yIndex,
    handleSwipe,
    movieColumns,
  }
}
