export type MoodSuggestion = {
  id: string
  recommendedMovies: Movie[]
  score: number
  title: string
}

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
  moodSuggestions?: {
    similar: MoodSuggestion
    contrasting: MoodSuggestion
  }
}
