import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Movie } from '../../playground/components/MovieCard'

interface UseMoviesOptions {
  enabled?: boolean
}

export const useMovies = (options: UseMoviesOptions = {}) => {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: ['suggestions'],
    placeholderData: keepPreviousData,
    enabled,
    queryFn: async () => {
      return fetch('/api/moodswipe', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).then((res) => res.json())
    },
  })

  const movies: Movie[] = query.data?.results || []

  return {
    ...query,
    movies,
  }
}
