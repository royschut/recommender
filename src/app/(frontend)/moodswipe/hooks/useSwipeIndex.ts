import { useState, useMemo } from 'react'
import { SwipeDirection } from '../page'
import { Movie } from '../Movie'

export const useSwipeIndex = (
  movies: Movie[],
  onUserAction?: (movieId: string, action: 'like' | 'dislike') => void,
) => {
  const [xIndex, setXIndex] = useState(1)
  const [yIndex, setYIndex] = useState(0)
  const [lastCenterIndex, setLastCenterIndex] = useState(0)

  // Build movie columns dynamically based on current movie and its like/dislike recommendations
  const movieColumns = useMemo(() => {
    if (!movies || movies.length === 0) return [[], [], []]

    const centerColumn = movies

    const referenceIndex = xIndex === 1 ? yIndex : lastCenterIndex
    const currentCenterMovie = movies[referenceIndex] || movies[0]

    const dislikeMovies = currentCenterMovie?.recommendations?.dislike || []
    const likeMovies = currentCenterMovie?.recommendations?.like || []

    const leftColumn =
      dislikeMovies.length > 0
        ? Array.from(
            { length: movies.length * 2 },
            (_, i) => dislikeMovies[i % dislikeMovies.length],
          )
        : []

    const rightColumn =
      likeMovies.length > 0
        ? Array.from({ length: movies.length * 2 }, (_, i) => likeMovies[i % likeMovies.length])
        : []

    return [leftColumn, centerColumn, rightColumn]
  }, [movies, yIndex, lastCenterIndex, xIndex])

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
        if (xIndex === 1 && movieColumns[0].length > 0) {
          const currentMovie = movieColumns[1][yIndex]
          if (currentMovie && onUserAction) {
            onUserAction(String(currentMovie.id), 'dislike')
          }
          setLastCenterIndex(yIndex)
          setXIndex(0)
        } else if (xIndex === 2) {
          setXIndex(1)
          setYIndex(lastCenterIndex)
        }
        break
      case 'right':
        if (xIndex === 1 && movieColumns[2].length > 0) {
          const currentMovie = movieColumns[1][yIndex]
          if (currentMovie && onUserAction) {
            onUserAction(String(currentMovie.id), 'like')
          }
          setLastCenterIndex(yIndex)
          setXIndex(2)
        } else if (xIndex === 0) {
          setXIndex(1)
          setYIndex(lastCenterIndex)
        }
        break
    }
  }

  return {
    xIndex,
    yIndex,
    handleSwipe,
    movieColumns,
  }
}
