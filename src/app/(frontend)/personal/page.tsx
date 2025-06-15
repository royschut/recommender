'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MovieCard, CardGrid, type Movie } from '@/components/MovieCard'

interface PersonalRecommendationsResponse {
  success: boolean
  recommendations: Movie[]
  favoriteCount: number
  totalRecommendations: number
  message: string
  error?: string
  details?: string
}

export default function PersonalRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    loadPersonalRecommendations()
  }, [])

  const loadPersonalRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/personal-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data: PersonalRecommendationsResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      setRecommendations(data.recommendations || [])
      setFavoriteCount(data.favoriteCount || 0)
    } catch (err: any) {
      setError(err.message || 'Er is een onbekende fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  const handleMovieClick = (movieId: string) => {
    router.push(`/movie/${movieId}`)
  }

  const handleBackToSearch = () => {
    router.push('/search')
  }

  const handleFavoriteChange = () => {
    // Refresh recommendations when favorites change
    loadPersonalRecommendations()
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <h2>Persoonlijke aanbevelingen laden...</h2>
          <p>We analyseren je favorieten...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <button onClick={handleBackToSearch} className="back-button">
          ← Terug naar zoeken
        </button>

        <div className="error">
          <h2>Er is een fout opgetreden</h2>
          <p>{error}</p>
          {error.includes('favorites') && (
            <p className="error-suggestion">
              💡 Tip: Voeg eerst enkele films toe aan je favorieten door op de ❤️ knop te klikken
              bij films die je leuk vindt.
            </p>
          )}
          <button onClick={loadPersonalRecommendations} className="retry-button">
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <button onClick={handleBackToSearch} className="back-button">
        ← Terug naar zoeken
      </button>

      <div className="header">
        <h1>✨ Persoonlijke Aanbevelingen</h1>
        <p className="subtitle">
          Op basis van je {favoriteCount} favoriete film{favoriteCount !== 1 ? 's' : ''}
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="no-recommendations">
          <h2>Geen persoonlijke aanbevelingen gevonden</h2>
          <p>
            Om persoonlijke aanbevelingen te krijgen, voeg eerst enkele films toe aan je favorieten
            door op de ❤️ knop te klikken bij films die je leuk vindt.
          </p>
          <button onClick={handleBackToSearch} className="search-button">
            Ga naar zoeken
          </button>
        </div>
      ) : (
        <>
          <div className="recommendations-summary">
            <p>
              We hebben {recommendations.length} film{recommendations.length !== 1 ? 's' : ''}{' '}
              gevonden die perfect bij je smaak passen!
            </p>
          </div>

          <CardGrid>
            {recommendations.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={handleMovieClick}
                onFavoriteChange={handleFavoriteChange}
                showOverview={true}
              />
            ))}
          </CardGrid>
        </>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .container {
          min-height: 100vh;
          background-color: #ffffff;
          color: #333333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .back-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          margin-bottom: 2rem;
          transition: background-color 0.2s;
        }

        .back-button:hover {
          background-color: #0056b3;
        }

        .loading,
        .error,
        .no-recommendations {
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading h2,
        .error h2,
        .no-recommendations h2 {
          color: #222222;
          margin-bottom: 1rem;
        }

        .loading p,
        .error p,
        .no-recommendations p {
          color: #666666;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
        }

        .error-suggestion {
          background-color: #fff3cd;
          color: #856404;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #ffeaa7;
          margin: 1rem auto;
          max-width: 500px;
        }

        .retry-button,
        .search-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.2s;
        }

        .retry-button:hover,
        .search-button:hover {
          background-color: #0056b3;
        }

        .header {
          text-align: center;
          margin-bottom: 3rem;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }

        .header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
          margin: 0;
        }

        .recommendations-summary {
          text-align: center;
          margin: 2rem 0;
          padding: 1.5rem;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .recommendations-summary p {
          font-size: 1.1rem;
          color: #555555;
          margin: 0;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .header h1 {
            font-size: 2rem;
          }

          .subtitle {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
