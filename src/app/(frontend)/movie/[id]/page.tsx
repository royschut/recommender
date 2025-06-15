'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MovieCard, CardGrid, type Movie } from '@/components/MovieCard'

interface RecommendationsResponse {
  success: boolean
  movie: Movie
  recommendations: Movie[]
  totalRecommendations: number
  error?: string
  details?: string
}

export default function MoviePage({ params }: { params: { id: string } }) {
  const [movie, setMovie] = useState<Movie | null>(null)
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadMovieAndRecommendations()
  }, [params.id])

  const loadMovieAndRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId: params.id }),
      })

      const data: RecommendationsResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      setMovie(data.movie)
      setRecommendations(data.recommendations || [])
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

  const formatGenres = (genres?: Array<{ genre: string }>) => {
    return genres?.map((g) => g.genre).join(', ') || 'Geen genres'
  }

  const formatLanguage = (lang?: string) => {
    const languages: Record<string, string> = {
      en: '🇺🇸 Engels',
      nl: '🇳🇱 Nederlands',
      fr: '🇫🇷 Frans',
      de: '🇩🇪 Duits',
      es: '🇪🇸 Spaans',
      it: '🇮🇹 Italiaans',
      ja: '🇯🇵 Japans',
      ko: '🇰🇷 Koreaans',
      zh: '🇨🇳 Chinees',
      ru: '🇷🇺 Russisch',
      pt: '🇵🇹 Portugees',
      hi: '🇮🇳 Hindi',
    }
    return languages[lang || ''] || lang?.toUpperCase() || 'Onbekend'
  }

  const formatPopularity = (popularity?: number) => {
    if (!popularity) return null
    if (popularity > 100) return '🔥 Zeer populair'
    if (popularity > 50) return '⭐ Populair'
    if (popularity > 20) return '👍 Bekend'
    return '💎 Niche'
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <h2>Film en aanbevelingen laden...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>Er is een fout opgetreden</h2>
          <p>{error}</p>
          <button onClick={handleBackToSearch} className="back-button">
            Terug naar zoeken
          </button>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="container">
        <div className="error">
          <h2>Film niet gevonden</h2>
          <button onClick={handleBackToSearch} className="back-button">
            Terug naar zoeken
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

      {/* Featured Movie */}
      <div className="featured-movie">
        <div className="movie-poster-large">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              width={300}
              height={450}
              className="poster-image-large"
            />
          ) : (
            <div className="poster-placeholder-large">
              <span>Geen poster</span>
            </div>
          )}
        </div>

        <div className="movie-details">
          <h1 className="movie-title">{movie.title}</h1>
          {movie.originalTitle && movie.originalTitle !== movie.title && (
            <p className="original-title">({movie.originalTitle})</p>
          )}

          <div className="movie-meta">
            {movie.voteAverage && (
              <span className="rating">
                ⭐ {movie.voteAverage.toFixed(1)}/10
                {movie.voteCount && (
                  <span className="vote-count">({movie.voteCount.toLocaleString()} stemmen)</span>
                )}
              </span>
            )}
            {movie.releaseDate && (
              <span className="release-date">📅 {new Date(movie.releaseDate).getFullYear()}</span>
            )}
          </div>

          <div className="movie-meta-secondary">
            {formatPopularity(movie.popularity) && (
              <span className="popularity">{formatPopularity(movie.popularity)}</span>
            )}
            {movie.originalLanguage && (
              <span className="language">{formatLanguage(movie.originalLanguage)}</span>
            )}
            {movie.adult && <span className="adult-indicator">🔞 18+</span>}
          </div>

          <p className="movie-genres">{formatGenres(movie.genres)}</p>

          {movie.overview && (
            <div className="movie-overview">
              <h3>Verhaal</h3>
              <p>{movie.overview}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h2>Soortgelijke films ({recommendations.length})</h2>

        {recommendations.length === 0 ? (
          <p className="no-recommendations">Geen soortgelijke films gevonden.</p>
        ) : (
          <CardGrid>
            {recommendations.map((recMovie) => (
              <MovieCard 
                key={recMovie.id} 
                movie={recMovie} 
                onClick={handleMovieClick}
                showOverview={true}
              />
            ))}
          </CardGrid>
        )}
      </div>

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
        .error {
          text-align: center;
          padding: 4rem 2rem;
        }

        .featured-movie {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 2rem;
          margin-bottom: 3rem;
          padding: 2rem;
          background: #f8f9fa;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .movie-poster-large {
          width: 300px;
          height: 450px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          border-radius: 8px;
          overflow: hidden;
        }

        .poster-image-large {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .poster-placeholder-large {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f0f0f0;
          color: #999;
          font-size: 1rem;
        }

        .movie-details {
          flex: 1;
        }

        .movie-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #222222;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }

        .original-title {
          font-size: 1.2rem;
          color: #555555;
          font-style: italic;
          margin-bottom: 1.5rem;
        }

        .movie-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .movie-meta-secondary {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }

        .rating {
          color: #ff9500;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .vote-count {
          color: #666;
          font-size: 0.9rem;
          font-weight: normal;
        }

        .release-date {
          color: #555555;
        }

        .popularity {
          background-color: #fff3cd;
          color: #856404;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .language {
          background-color: #d1ecf1;
          color: #0c5460;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .adult-indicator {
          background-color: #f8d7da;
          color: #721c24;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .movie-genres {
          font-size: 1.1rem;
          color: #007bff;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .movie-overview {
          margin-top: 1.5rem;
        }

        .movie-overview h3 {
          font-size: 1.3rem;
          color: #222222;
          margin-bottom: 0.75rem;
        }

        .movie-overview p {
          font-size: 1rem;
          line-height: 1.6;
          color: #444444;
        }

        .recommendations-section {
          margin-top: 3rem;
        }

        .recommendations-section h2 {
          font-size: 2rem;
          color: #222222;
          margin-bottom: 1.5rem;
        }

        .no-recommendations {
          text-align: center;
          color: #666;
          font-size: 1.1rem;
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .featured-movie {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            text-align: center;
          }

          .movie-poster-large {
            margin: 0 auto;
          }

          .movie-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  )
}
