'use client'

import React, { useState, useEffect } from 'react'
import { Dialog } from 'radix-ui'
import { Cross2Icon } from '@radix-ui/react-icons'
import { cn } from '../utils/cn'
import Card from './ui/Card'

interface Movie {
  id: string
  title: string
  description?: string
  image?: string
  poster_path?: string
}

interface ResultModalProps {
  movie: Movie | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ResultModal: React.FC<ResultModalProps> = ({ movie, open, onOpenChange }) => {
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  // Fetch recommendations when movie changes
  useEffect(() => {
    if (!movie || !open) {
      setRecommendations([])
      return
    }

    const fetchRecommendations = async () => {
      setLoadingRecommendations(true)
      try {
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId: movie.id }),
        })

        if (response.ok) {
          const data = await response.json()
          setRecommendations(data.recommendations || [])
        }
      } catch (error) {
        console.error('Recommendations error:', error)
        setRecommendations([])
      } finally {
        setLoadingRecommendations(false)
      }
    }

    fetchRecommendations()
  }, [movie, open])

  if (!movie) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in z-40" />
        <Dialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-3xl max-h-[90vh] overflow-y-auto',
            'bg-white rounded-lg shadow-2xl z-50',
            'animate-fade-in',
          )}
        >
          <div className="relative">
            {/* Close Button */}
            <Dialog.Close
              className={cn(
                'absolute top-4 right-4 z-10',
                'w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm',
                'flex items-center justify-center text-white',
                'hover:bg-black/30 transition-colors duration-200',
              )}
            >
              <Cross2Icon className="w-4 h-4" />
            </Dialog.Close>

            {/* Movie Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Movie Poster */}
              <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden">
                {movie.image || movie.poster_path ? (
                  <img
                    src={movie.image || movie.poster_path}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                    🎬
                  </div>
                )}
              </div>

              {/* Movie Info */}
              <div className="space-y-4">
                <Dialog.Title className="text-2xl font-bold text-gray-900">
                  {movie.title}
                </Dialog.Title>

                {movie.description && (
                  <Dialog.Description className="text-gray-600 leading-relaxed">
                    {movie.description}
                  </Dialog.Description>
                )}
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Meer zoals dit</h3>

              {loadingRecommendations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin w-6 h-6 border-2 border-violet-200 border-t-violet-500 rounded-full"></div>
                  <span className="ml-2 text-gray-500">Aanbevelingen laden...</span>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {recommendations.map((rec) => (
                    <RecommendationCard key={rec.id} movie={rec} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Geen aanbevelingen beschikbaar</p>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface RecommendationCardProps {
  movie: Movie
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ movie }) => {
  return (
    <Card
      variant="default"
      padding="none"
      className="flex-shrink-0 w-32 cursor-pointer hover:shadow-lg transition-all duration-200"
    >
      <div className="aspect-[2/3] bg-gray-100">
        {movie.image || movie.poster_path ? (
          <img
            src={movie.image || movie.poster_path}
            alt={movie.title}
            className="w-full h-full object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl rounded-t-lg">
            🎬
          </div>
        )}
      </div>
      <div className="p-2">
        <h4 className="text-xs font-medium text-gray-900 line-clamp-2">{movie.title}</h4>
      </div>
    </Card>
  )
}

export default ResultModal
