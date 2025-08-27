'use client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import React from 'react'
import Image from 'next/image'
import phoneImage from './assets/phone.png'
import { Movie } from '../playground/components/MovieCard'
import { SwipeContainer } from './components/SwipeContainer'

const Playground = () => {
  const [currentVerticalIndex, setCurrentVerticalIndex] = React.useState(0)
  const [currentHorizontalIndex, setCurrentHorizontalIndex] = React.useState(1) // Start in middle column

  const suggestions = useQuery({
    queryKey: ['suggestions'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const requestBody = {
        limit: 100,
      }

      return fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }).then((res) => res.json())
    },
  })

  const movies = suggestions.data?.results as Movie[]

  // Split movies into 3 arrays of 20 each
  const movieColumns = React.useMemo(() => {
    if (!movies || movies.length === 0) return [[], [], []]

    const leftColumn = movies.slice(0, 20)
    const centerColumn = movies.slice(20, 40)
    const rightColumn = movies.slice(40, 60)

    return [leftColumn, centerColumn, rightColumn]
  }, [movies])

  const renderMovieItem = (movie: Movie, index: number, isActive: boolean) => (
    <>
      <img
        src={movie.posterUrl}
        alt={movie.title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
      {isActive && (
        <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
          <h2 className="text-lg font-bold mb-2">{movie.title}</h2>
          <p className="text-sm opacity-80">{movie.overview?.substring(0, 100)}...</p>
        </div>
      )}
    </>
  )

  if (!movies || movies.length === 0) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-8">
      <div className="relative">
        <Image src={phoneImage} alt="Phone mockup" width={390} height={844} className="block" />
        <div
          className="absolute bg-black rounded-[25px] overflow-hidden"
          style={{ top: 15, right: 15, bottom: 15, left: 15, borderRadius: 25 }}
        >
          <SwipeContainer
            movieColumns={movieColumns}
            currentVerticalIndex={currentVerticalIndex}
            currentHorizontalIndex={currentHorizontalIndex}
            onVerticalIndexChange={setCurrentVerticalIndex}
            onHorizontalIndexChange={setCurrentHorizontalIndex}
            renderItem={renderMovieItem}
          />
        </div>
      </div>
    </div>
  )
}

export default Playground
