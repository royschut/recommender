import { useState, useEffect, useMemo } from 'react'
import { Movie } from '../../playground/components/MovieCard'

type SwipeDirection = 'up' | 'down' | 'left' | 'right'

interface UseSwipeIndexProps {
  movies: Movie[]
}

export const useSwipeIndex = ({ movies }: UseSwipeIndexProps) => {
  const [xIndex, setXIndex] = useState(1) // Start at center column
  const [yIndex, setYIndex] = useState(0)

  // Split movies into 3 arrays of 20 each
  const movieColumns = useMemo(() => {
    if (!movies || movies.length === 0) return [[], [], []]

    const leftColumn = movies.slice(0, 20)
    const centerColumn = movies.slice(20, 40)
    const rightColumn = movies.slice(40, 60)

    return [leftColumn, centerColumn, rightColumn]
  }, [movies])

  const setIndex = (newXIndex: number, newYIndex: number) => {
    setXIndex(newXIndex)
    setYIndex(newYIndex)
  }

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

  // Add keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          handleSwipe('up')
          break
        case 'ArrowDown':
          event.preventDefault()
          handleSwipe('down')
          break
        case 'ArrowLeft':
          event.preventDefault()
          handleSwipe('left')
          break
        case 'ArrowRight':
          event.preventDefault()
          handleSwipe('right')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [xIndex, yIndex, movieColumns])

  return {
    xIndex,
    yIndex,
    setIndex,
    handleSwipe,
    movieColumns,
  }
}
