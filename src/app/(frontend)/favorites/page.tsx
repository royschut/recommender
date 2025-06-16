'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MovieCard, CardGrid, type Movie } from '@/components/MovieCard'

interface Favorite {
  id: string
  movie: Movie
  addedAt: string
}

interface FavoritesResponse {
  success: boolean
  favorites: Favorite[]
  total: number
  error?: string
  details?: string
}

interface PersonalRecommendationsResponse {
  success: boolean
  recommendations: Movie[]
  favoriteCount: number
  totalRecommendations: number
  message: string
  error?: string
  details?: string
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/favorites')
      const data: FavoritesResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      setFavorites(data.favorites || [])
    } catch (err: any) {
      setError(err.message || 'Er is een onbekende fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  const loadPersonalRecommendations = async () => {
    if (favorites.length === 0) {
      setError('Voeg eerst enkele films toe aan je favorieten om aanbevelingen te krijgen')
      return
    }

    setLoadingRecommendations(true)
    try {
      const response = await fetch('/api/personal-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data: PersonalRecommendationsResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden bij het laden van aanbevelingen')
      }

      setRecommendations(data.recommendations || [])
      setShowRecommendations(true)
    } catch (err: any) {
      setError(err.message || 'Er is een onbekende fout opgetreden bij het laden van aanbevelingen')
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const handleMovieClick = (movieId: string) => {
    router.push(`/movie/${movieId}`)
  }

  const handleBackToSearch = () => {
    router.push('/search')
  }

  const handleFavoriteChange = () => {
    // Refresh favorites when a movie is removed from favorites
    loadFavorites()
  }

  const handlePersonalRecommendations = () => {
    router.push('/personal')
  }

  const toggleRecommendations = () => {
    if (!showRecommendations && recommendations.length === 0) {
      loadPersonalRecommendations()
    } else {
      setShowRecommendations(!showRecommendations)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <h2>Favorieten laden...</h2>
          <p>Even geduld...</p>
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
          <button onClick={loadFavorites} className="retry-button">
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
        <h1>❤️ Mijn Favorieten</h1>
        <p className="subtitle">
          Je hebt {favorites.length} favoriet{favorites.length !== 1 ? 'e' : ''} film
          {favorites.length !== 1 ? 's' : ''}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="no-favorites">
          <h2>Nog geen favorieten</h2>
          <p>
            Je hebt nog geen favoriete films toegevoegd. Ga naar de zoekpagina en klik op de ❤️ knop
            bij films die je leuk vindt!
          </p>
          <button onClick={handleBackToSearch} className="search-button">
            Ga naar zoeken
          </button>
        </div>
      ) : (
        <>
          <div className="favorites-actions">
            <button
              onClick={toggleRecommendations}
              className="recommendations-button"
              disabled={loadingRecommendations}
            >
              {loadingRecommendations
                ? '⏳ Laden...'
                : showRecommendations
                  ? '🔽 Verberg Aanbevelingen'
                  : '✨ Toon Persoonlijke Aanbevelingen'}
            </button>
            <p className="recommendations-description">
              {showRecommendations
                ? `${recommendations.length} aanbevelingen op basis van je favorieten`
                : 'Krijg gepersonaliseerde filmsuggties op basis van je favorieten'}
            </p>
          </div>

          {showRecommendations && recommendations.length > 0 && (
            <div className="recommendations-section">
              <h2>🎯 Aanbevolen voor jou</h2>
              <div className="recommendations-summary">
                <p>
                  Op basis van je favorieten hebben we {recommendations.length} perfecte film
                  {recommendations.length !== 1 ? 's' : ''} voor je gevonden!
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
            </div>
          )}

          <div className="favorites-list-section">
            <h2>❤️ Jouw Favorieten ({favorites.length})</h2>
            <div className="favorites-summary">
              <p>
                Hier zijn al je favoriete films. Klik op de ❤️ knop om films uit je favorieten te
                verwijderen.
              </p>
            </div>

            <CardGrid>
              {favorites.map((favorite) => (
                <div key={favorite.id} className="favorite-item">
                  <MovieCard
                    movie={favorite.movie}
                    onClick={handleMovieClick}
                    onFavoriteChange={handleFavoriteChange}
                    showOverview={true}
                  />
                  <div className="favorite-meta">
                    <span className="added-date">
                      📅 Toegevoegd op {formatDate(favorite.addedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </CardGrid>
          </div>
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
        .no-favorites {
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading h2,
        .error h2,
        .no-favorites h2 {
          color: #222222;
          margin-bottom: 1rem;
        }

        .loading p,
        .error p,
        .no-favorites p {
          color: #666666;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
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
          background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
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

        .favorites-actions {
          text-align: center;
          margin-bottom: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }

        .recommendations-button {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          background-color: rgba(255, 255, 255, 0.9);
          color: #667eea;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .recommendations-button:hover:not(:disabled) {
          background-color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .recommendations-button:disabled {
          background-color: rgba(255, 255, 255, 0.6);
          cursor: not-allowed;
          transform: none;
        }

        .recommendations-description {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
          margin: 0;
        }

        .recommendations-section {
          margin-bottom: 3rem;
          padding: 2rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          border: 2px solid #dee2e6;
        }

        .recommendations-section h2 {
          color: #495057;
          text-align: center;
          margin-bottom: 1rem;
          font-size: 2rem;
        }

        .favorites-list-section {
          margin-bottom: 2rem;
        }

        .favorites-list-section h2 {
          color: #222222;
          text-align: center;
          margin-bottom: 1rem;
          font-size: 2rem;
        }

        .favorites-summary {
          text-align: center;
          margin: 2rem 0;
          padding: 1.5rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          color: #555555;
        }

        .favorite-item {
          position: relative;
        }

        .favorite-meta {
          text-align: center;
          margin-top: 0.5rem;
          padding: 0.5rem;
        }

        .added-date {
          font-size: 0.85rem;
          color: #666666;
          background-color: #f8f9fa;
          padding: 0.3rem 0.8rem;
          border-radius: 15px;
          display: inline-block;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .header h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  )
}
