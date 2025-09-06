import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
import type { Movie } from '../../playground/components/MovieCard'

interface Page {
  results: Movie[]
}

interface PageParam {
  excluded: string[]
}

export function useMovies(enabled = true) {
  return useInfiniteQuery<Page, Error, InfiniteData<Page>, string[], PageParam>({
    queryKey: ['suggestions'],
    enabled,
    initialPageParam: { excluded: [] },
    queryFn: async ({ pageParam }) => {
      const url = new URL('/api/moodswipe', window.location.origin)
      if (pageParam.excluded.length > 0) {
        url.searchParams.set('excluded', pageParam.excluded.join(','))
      }

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      return (await res.json()) as Page
    },
    getNextPageParam: (_, allPages) => {
      return { excluded: allPages.flatMap((page) => page.results.map((movie) => String(movie.id))) }
    },
  })
}
