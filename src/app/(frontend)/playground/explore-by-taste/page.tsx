'use client'

import React, { useState } from 'react'
import PlaygroundLayout from '../layout/PlaygroundLayout'
import { Button, Badge, Card } from '../components/ui'
import { HeartIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons'
import { cn } from '../utils/cn'
import '../index.css'

const ExploreByTastePage = () => {
  const [currentMovie, setCurrentMovie] = useState(0)
  const [likedMovies, setLikedMovies] = useState<string[]>([])

  const movies = [
    {
      title: 'The Grand Budapest Hotel',
      genre: 'Komedie • Drama',
      year: '2014',
      description:
        'Een charmante komedie over de avonturen van een beroemde concierge en zijn protégé in een luxe Europees hotel.',
    },
    {
      title: 'Inception',
      genre: 'Sci-Fi • Thriller',
      year: '2010',
      description:
        'Een meesterwerk over dromen binnen dromen, waar realiteit en fantasie vervagen.',
    },
    {
      title: 'Her',
      genre: 'Drama • Romance',
      year: '2013',
      description:
        'Een ontroerend verhaal over liefde tussen een mens en kunstmatige intelligentie.',
    },
  ]

  const handleLike = () => {
    setLikedMovies((prev) => [...prev, movies[currentMovie].title])
    nextMovie()
  }

  const handleSkip = () => {
    nextMovie()
  }

  const nextMovie = () => {
    setCurrentMovie((prev) => (prev + 1) % movies.length)
  }

  const movie = movies[currentMovie]

  return (
    <PlaygroundLayout activeTab="explore-by-taste">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-6">💫</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Verken op Smaak</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Swipe door films en geef aan wat je leuk vindt. We leren van jouw smaak om betere
            aanbevelingen te doen.
          </p>
        </div>

        {/* Movie Card */}
        <div className="max-w-md mx-auto mb-8">
          <Card variant="elevated" className="overflow-hidden">
            <div className="space-y-6">
              {/* Movie Poster Placeholder */}
              <div className="aspect-[3/4] bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎬</div>
                  <span className="text-violet-700 text-sm font-medium">Film Poster</span>
                </div>
              </div>

              {/* Movie Info */}
              <div className="space-y-4 px-2">
                <h3 className="text-xl font-bold text-gray-900">{movie.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default">{movie.genre}</Badge>
                  <Badge variant="secondary">{movie.year}</Badge>
                </div>
                <p className="text-gray-600 leading-relaxed">{movie.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSkip}
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <Cross2Icon className="w-5 h-5 mr-2" />
                  Skip
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleLike}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Like
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress */}
        <div className="text-center mb-8">
          <p className="text-gray-500 mb-3">
            Film {currentMovie + 1} van {movies.length}
          </p>
          <div className="flex gap-2 justify-center">
            {movies.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-3 h-3 rounded-full transition-colors duration-300',
                  index === currentMovie ? 'bg-violet-500' : 'bg-gray-300',
                )}
              />
            ))}
          </div>
        </div>

        {/* Liked Movies */}
        {likedMovies.length > 0 && (
          <div className="mb-8">
            <Card variant="default" className="max-w-lg mx-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <HeartIcon className="w-5 h-5 text-red-500" />
                  Films die je leuk vindt
                </h3>
                <div className="flex flex-wrap gap-2">
                  {likedMovies.map((title, index) => (
                    <Badge key={index} variant="success">
                      {title}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Info Card */}
        <div className="max-w-lg mx-auto">
          <Card variant="default" className="bg-green-50 border-green-200">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                🎬 Hoe het werkt
              </h3>
              <p className="text-green-700 leading-relaxed">
                Door films te liken of te skippen help je ons je smaak te begrijpen. Hoe meer je
                swiped, hoe beter onze aanbevelingen worden!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </PlaygroundLayout>
  )
}

export default ExploreByTastePage
