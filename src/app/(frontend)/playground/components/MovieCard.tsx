import { CalendarIcon, InfoCircledIcon, StarFilledIcon, VideoIcon } from '@radix-ui/react-icons'
import { classNames } from '../utils/cn'
import { Card } from './ui'

export type Movie = {
  id: string
  title: string
  description?: string
  overview?: string
  image?: string
  poster_path?: string
  posterUrl?: string
  voteAverage?: number
  vote_average?: number
  releaseDate?: string
  release_date?: string
  genres?: Array<{ genre: string }> | string[]
  similarityScore?: number
  matchScore?: number
}

type Props = {
  movie: Movie
  onClick: () => void
  isDummy?: boolean
}

const MovieCard: React.FC<Props> = ({ movie, onClick, isDummy = false }) => {
  const getPosterUrl = () => {
    return movie.image || movie.poster_path || movie.posterUrl
  }

  const getRating = () => {
    return movie.voteAverage || movie.vote_average
  }

  const getReleaseYear = () => {
    const date = movie.releaseDate || movie.release_date
    return date ? new Date(date).getFullYear() : null
  }

  const getGenres = () => {
    if (!movie.genres) return []
    if (Array.isArray(movie.genres)) {
      if (movie.genres.length > 0 && typeof movie.genres[0] === 'object') {
        return (movie.genres as Array<{ genre: string }>).map((g) => g.genre)
      }
      return movie.genres as string[]
    }
    return []
  }

  const getMatchScore = () => {
    return movie.similarityScore || movie.matchScore
  }

  const getDescription = () => {
    return movie.description || movie.overview
  }

  return (
    <Card
      variant="default"
      padding="none"
      className={classNames(
        'overflow-hidden cursor-pointer transition-transform duration-200 ease-out group',
        'hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01]',
        'rounded-2xl border-0 bg-white shadow-sm',
        isDummy && 'opacity-50 cursor-default hover:transform-none hover:shadow-sm',
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[4/5] bg-gradient-to-br from-violet-50 via-gray-50 to-indigo-50 overflow-hidden">
        {getPosterUrl() ? (
          <img
            src={getPosterUrl()}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <VideoIcon className="w-16 h-16 text-violet-300 mx-auto mb-3" />
              <span className="text-violet-400 text-sm font-medium">Geen poster</span>
            </div>
          </div>
        )}

        {getMatchScore() && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-2 py-1 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1 border border-white/20 opacity-90">
            <InfoCircledIcon className="w-3 h-3" />
            MATCH {Math.round((getMatchScore() || 0) * 100)}%
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      <div className="p-3 space-y-1.5">
        <div className="space-y-0.5">
          <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 group-hover:text-violet-600 transition-colors duration-200">
            {movie.title}
          </h3>
          {getReleaseYear() && (
            <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3 text-gray-400" />
                {getReleaseYear()}
              </div>
              {getRating() && (
                <div className="flex items-center gap-1 text-gray-400">
                  <StarFilledIcon className="w-3 h-3 text-amber-400" />
                  <span className="text-xs">{getRating()?.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {getGenres().length > 0 && (
          <div className="flex flex-wrap gap-1">
            {getGenres()
              .slice(0, 2)
              .map((genre, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 text-xs rounded-full font-medium border border-violet-200/50 shadow-sm"
                >
                  {genre}
                </span>
              ))}
            {getGenres().length > 2 && (
              <span className="px-2 py-1 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 text-xs rounded-full font-medium border border-gray-200/50 shadow-sm">
                +{getGenres().length - 2}
              </span>
            )}
          </div>
        )}

        {getDescription() && (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 font-light">
            {getDescription()}
          </p>
        )}
      </div>
    </Card>
  )
}

export const SkeletonCard: React.FC = () => {
  return (
    <Card variant="default" padding="none" className="overflow-hidden animate-pulse rounded-2xl">
      <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 relative">
        <div className="absolute top-3 left-3 w-16 h-6 bg-gray-300 rounded-lg"></div>
        <div className="absolute top-3 right-3 w-12 h-6 bg-gray-300 rounded-lg"></div>
      </div>

      <div className="p-3 space-y-1.5">
        <div className="space-y-0.5">
          <div className="h-4 bg-gray-200 rounded-lg w-4/5"></div>
          <div className="h-3 bg-gray-200 rounded-lg w-1/3"></div>
        </div>

        <div className="flex gap-1 flex-wrap">
          <div className="h-5 bg-gray-200 rounded-full w-14"></div>
          <div className="h-5 bg-gray-200 rounded-full w-12"></div>
        </div>

        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded-md w-full"></div>
          <div className="h-3 bg-gray-200 rounded-md w-3/4"></div>
        </div>
      </div>
    </Card>
  )
}

export default MovieCard
