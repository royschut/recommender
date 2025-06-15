import React, { useState, useEffect } from 'react'
import Image from 'next/image'

export interface Movie {
  id: string
  title: string
  originalTitle?: string
  overview?: string
  releaseDate?: string
  posterUrl?: string
  genres?: Array<{ genre: string }>
  voteAverage?: number
  voteCount?: number
  popularity?: number
  originalLanguage?: string
  adult?: boolean
  similarityScore?: number
}

interface MovieCardProps {
  movie: Movie
  onClick?: (movieId: string) => void
  showOverview?: boolean
  onFavoriteChange?: () => void
}

export function MovieCard({ movie, onClick, showOverview = true, onFavoriteChange }: MovieCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  // Check if movie is in favorites on component mount
  useEffect(() => {
    checkFavoriteStatus()
  }, [movie.id])

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch('/api/favorites')
      const data = await response.json()
      
      if (data.success) {
        const isInFavorites = data.favorites.some((fav: any) => 
          String(fav.movie?.id) === String(movie.id) || String(fav.movie) === String(movie.id)
        )
        setIsFavorite(isInFavorites)
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when clicking favorite button
    
    setFavoriteLoading(true)
    try {
      const response = await fetch('/api/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId: movie.id }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsFavorite(!isFavorite)
        if (onFavoriteChange) {
          onFavoriteChange()
        }
      } else {
        console.error('Favorite operation failed:', data.error)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setFavoriteLoading(false)
    }
  }
  const formatScore = (score?: number) => {
    return score ? (score * 100).toFixed(1) + '%' : 'N/A'
  }

  const formatGenres = (genres?: Array<{ genre: string }>) => {
    return genres?.map((g) => g.genre).join(', ') || 'Geen genres'
  }

  const formatLanguage = (lang?: string) => {
    const languages: Record<string, string> = {
      'en': '🇺🇸 Engels',
      'nl': '🇳🇱 Nederlands', 
      'fr': '🇫🇷 Frans',
      'de': '🇩🇪 Duits',
      'es': '🇪🇸 Spaans',
      'it': '🇮🇹 Italiaans',
      'ja': '🇯🇵 Japans',
      'ko': '🇰🇷 Koreaans',
      'zh': '🇨🇳 Chinees',
      'ru': '🇷🇺 Russisch',
      'pt': '🇵🇹 Portugees',
      'hi': '🇮🇳 Hindi'
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

  const handleClick = () => {
    if (onClick) {
      onClick(movie.id)
    }
  }

  return (
    <div className={`movie-card ${onClick ? 'clickable' : ''}`} onClick={handleClick}>
      <div className="movie-poster">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            width={200}
            height={300}
            className="poster-image"
          />
        ) : (
          <div className="poster-placeholder">
            <span>Geen poster</span>
          </div>
        )}
        
        {/* Favorite button */}
        <button 
          className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          title={isFavorite ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'}
        >
          {favoriteLoading ? '⏳' : (isFavorite ? '❤️' : '🤍')}
        </button>
      </div>

      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        {movie.originalTitle && movie.originalTitle !== movie.title && (
          <p className="original-title">({movie.originalTitle})</p>
        )}

        <div className="movie-meta">
          {movie.similarityScore !== undefined && (
            <span className="similarity-score">
              Match: {formatScore(movie.similarityScore)}
            </span>
          )}
          {movie.voteAverage && (
            <span className="rating">
              ⭐ {movie.voteAverage.toFixed(1)}/10
              {movie.voteCount && (
                <span className="vote-count">({movie.voteCount.toLocaleString()} stemmen)</span>
              )}
            </span>
          )}
          {movie.releaseDate && (
            <span className="release-date">
              📅 {new Date(movie.releaseDate).getFullYear()}
            </span>
          )}
        </div>

        <div className="movie-meta-secondary">
          {formatPopularity(movie.popularity) && (
            <span className="popularity">{formatPopularity(movie.popularity)}</span>
          )}
          {movie.originalLanguage && (
            <span className="language">{formatLanguage(movie.originalLanguage)}</span>
          )}
          {movie.adult && (
            <span className="adult-indicator">🔞 18+</span>
          )}
        </div>

        <p className="movie-genres">{formatGenres(movie.genres)}</p>

        {showOverview && movie.overview && (
          <p className="movie-overview">{movie.overview}</p>
        )}
      </div>

      <style jsx>{`
        .movie-card {
          border: 1px solid #ddd;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          color: #333333;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .movie-card.clickable {
          cursor: pointer;
        }

        .movie-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .movie-poster {
          width: 100%;
          align-items: center;
          justify-content: center;
          display: flex;
          position: relative;
          background-color: #f5f5f5;
        }

        .favorite-btn {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 10;
        }

        .favorite-btn:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .favorite-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
          transform: none;
        }

        .favorite-btn.favorited {
          background: rgba(255, 240, 240, 0.95);
        }

        .poster-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .poster-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f0f0f0;
          color: #999;
          font-size: 0.9rem;
        }

        .movie-info {
          padding: 1.5rem;
        }

        .movie-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #222222;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .original-title {
          font-size: 0.9rem;
          color: #555555;
          font-style: italic;
          margin-bottom: 1rem;
        }

        .movie-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .movie-meta-secondary {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          margin-bottom: 1rem;
          font-size: 0.85rem;
        }

        .similarity-score {
          background-color: #e7f3ff;
          color: #0066cc;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-weight: 500;
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
          font-size: 0.8rem;
          font-weight: normal;
        }

        .release-date {
          color: #555555;
        }

        .popularity {
          background-color: #fff3cd;
          color: #856404;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
          font-size: 0.8rem;
        }

        .language {
          background-color: #d1ecf1;
          color: #0c5460;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
          font-size: 0.8rem;
        }

        .adult-indicator {
          background-color: #f8d7da;
          color: #721c24;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .movie-genres {
          font-size: 0.9rem;
          color: #007bff;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .movie-overview {
          font-size: 0.7rem;
          color: #444444;
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

interface CardGridProps {
  children: React.ReactNode
}

export function CardGrid({ children }: CardGridProps) {
  return (
    <div className="card-grid">
      {children}
      <style jsx>{`
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .card-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
