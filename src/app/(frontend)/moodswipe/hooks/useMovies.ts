import { useInfiniteQuery, InfiniteData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Movie } from '../Movie'

interface Page {
  results: Movie[]
}

interface PageParam {
  excluded: string[]
}

interface UserAction {
  movieId: string
  action: 'like' | 'dislike'
}

export interface Mood {
  id: string
  description: string
  title: string
  score: number
}

export function useMovies(enabled = true) {
  const [userProfile, setUserProfile] = useState<UserAction[]>([])
  const [moodProfile, setMoodProfile] = useState<{ [key: Mood['id']]: number }>({})

  const onUserAction = (movieId: string, action: 'like' | 'dislike') => {
    const swipeAction: UserAction = { movieId, action }
    setUserProfile((prev) => [...prev, swipeAction])
  }
  const query = useInfiniteQuery<
    Page,
    Error,
    InfiniteData<Page>,
    (string | UserAction[])[],
    PageParam
  >({
    queryKey: ['suggestions'], //userProfile
    enabled,
    initialPageParam: { excluded: [] },
    queryFn: async ({ pageParam }) => {
      const res = await fetch('/api/moodswipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          excluded: pageParam.excluded,
          userProfile: userProfile,
        }),
      })
      return (await res.json()) as Page
    },
    getNextPageParam: (_, allPages) => {
      return {
        excluded: allPages.flatMap((page) => page.results?.map((movie) => String(movie.id))),
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  })

  const moods = useQuery<{ results: Mood[] }>({
    queryKey: ['moods', userProfile],
    queryFn: async () => {
      const res = await fetch('/api/moodswipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          getMoods: true,
          userProfile,
        }),
      })
      return await res.json()
    },
    placeholderData: (previousData) => previousData,
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  const moodBasedSuggestions = useQuery({
    queryKey: ['suggestions', 'moodProfile', moodProfile],
    queryFn: async () => {
      const res = await fetch('/api/moodswipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodProfile,
        }),
      })
      return await res.json()
    },
    placeholderData: (previousData) => previousData,
    enabled: Object.keys(moodProfile).length > 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  const onConfigureMood = (newMoodProfile: { [key: Mood['id']]: number }) => {
    setMoodProfile(newMoodProfile)
  }

  return {
    ...query,
    moods: moods.data?.results,
    onUserAction,
    userProfile,
    onConfigureMood,
    moodBasedSuggestions,
  }
}
