import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
import { Movie } from '../Movie'

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
      const res = await fetch('/api/moodswipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excluded: pageParam.excluded }),
      })
      return (await res.json()) as Page
    },
    getNextPageParam: (_, allPages) => {
      return { excluded: allPages.flatMap((page) => page.results.map((movie) => String(movie.id))) }
    },
  })
}
