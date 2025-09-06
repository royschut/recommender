import { useState, useMemo } from 'react'
import { Movie } from '../../playground/components/MovieCard'
import { SwipeDirection } from '../page'

export const useSwipeIndex = (movies: Movie[]) => {
  const [xIndex, setXIndex] = useState(1) // Start at center column
  const [yIndex, setYIndex] = useState(0)

  // Split movies into 3 arrays of 20 each
  const movieColumns = useMemo(() => {
    if (!movies || movies.length === 0) return [[], [], []]

    const leftColumn = movies //.slice(0, 20)
    const centerColumn = movies //.slice(20, 40)
    const rightColumn = movies //.slice(40, 60)

    return [leftColumn, centerColumn, rightColumn]
  }, [movies])

  const handleSwipe = (direction: SwipeDirection) => {
    const currentColumn = movieColumns[xIndex]

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
      case 'left':
        if (xIndex > 0) {
          setXIndex(xIndex - 1)
        }
        break
      case 'right':
        if (xIndex < movieColumns.length - 1) {
          setXIndex(xIndex + 1)
        }
        break
    }
  }

  return {
    xIndex,
    yIndex,
    handleSwipe,
    movieColumns: [[], movies, []],
  }
}
