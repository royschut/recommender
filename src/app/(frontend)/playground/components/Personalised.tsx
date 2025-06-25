import { PersonIcon, ReloadIcon } from '@radix-ui/react-icons'

const Personalised = () => {
  return (
    <div className="space-y-6">
      {suggestions.isLoading ? (
        <div className="space-y-8">
          <div className="text-center pt-4 pb-6">
            <ReloadIcon className="inline-block animate-spin w-8 h-8 text-violet-500 mb-4" />
            <p className="text-gray-600 text-lg font-medium flex items-center justify-center gap-2">
              <PersonIcon className="w-5 h-5" />
              Creating your personalized recommendations...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-left px-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">For You</h3>
            <p className="text-sm text-gray-500">Based on your viewing history and preferences</p>
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 px-6 min-w-max">
              {suggestions.data?.results.map((movie: Movie) => (
                <div key={movie.id} className="flex-shrink-0 w-48">
                  <MovieCard movie={movie} onClick={() => setSelectedMovie(movie)} compact />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Personalised
