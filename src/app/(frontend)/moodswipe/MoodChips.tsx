import React, { useState } from 'react'
import { Mood } from './hooks/useMovies'

export type MoodShape = { title?: string; description?: string; score?: number }

interface MoodChipsProps {
  moods?: Mood[] | undefined
  onConfigureMood: (moodProfile: { [key: Mood['id']]: number }) => void
}

export const MoodChips: React.FC<MoodChipsProps> = ({ moods, onConfigureMood }) => {
  const [showAll, setShowAll] = useState(false)
  const sortedMoods = moods?.slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0)) ?? []
  const moodDict =
    moods?.reduce(
      (acc, mood) => {
        if (mood.id) {
          acc[mood.id] = mood.score ?? 0
        }
        return acc
      },
      {} as { [key: Mood['id']]: number },
    ) || {}
  const [moodProfile, setMoodProfile] = useState<{ [key: Mood['id']]: number }>(moodDict)
  const topMoods = sortedMoods.slice(0, 4)

  if (topMoods.length === 0) return null

  return (
    <>
      <div className="px-2 pt-2 absolute top-2 left-0 right-0 w-full flex flex-col gap-1 items-end z-20">
        {topMoods.map((mood, idx) => (
          <div
            key={mood.title ?? idx}
            className="inline-flex items-center space-x-2 rounded-full bg-black/60 py-1.5 px-3 text-sm text-white/90 drop-shadow-2xl"
            title={mood.description}
          >
            <span className="font-medium">{mood.title ?? 'Unknown'}</span>
            <span className="text-xs text-white/60">
              {Math.round((mood.score ?? 0) * 100) / 100}
            </span>
          </div>
        ))}
        <button
          className="mt-2 text-xs text-white drop-shadow-2xl hover:text-white px-2 py-1 flex items-center gap-1"
          type="button"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0px 1px #fff' }}
          onClick={() => setShowAll(true)}
        >
          <span>Adjust</span>
          <span
            aria-hidden="true"
            className="text-white text-base"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0px 1px #fff' }}
          >
            ⚙️
          </span>
        </button>
      </div>
      {/* Overlay for all moods */}
      {showAll && (
        <div
          id="ALL"
          className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in overflow-y-auto" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute top-4 right-6 z-[101]">
              <button
                className="text-white text-2xl p-2 rounded-full hover:bg-white/10"
                type="button"
                aria-label="Sluiten"
                onClick={() => setShowAll(false)}
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0px 1px #fff' }}
              >
                ×
              </button>
            </div>
            <div
              className="w-full max-w-sm mx-auto bg-black/70 rounded-xl p-6 flex flex-col gap-3 shadow-2xl backdrop-blur-md overflow-y-auto z-[101]"
              style={{ maxHeight: '100%' }}
            >
              <h2 className="text-white text-lg font-bold mb-2 text-center">
                Compose mood profile
              </h2>
              {sortedMoods.map((mood) => {
                const key = mood.id

                return (
                  <div key={key} className="flex flex-col gap-2 mb-2">
                    <div
                      className="inline-flex items-center space-x-2 rounded-full py-2 px-4 text-base text-white/90 bg-black/60 shadow"
                      title={mood.description}
                    >
                      <span className="font-semibold">{mood.title ?? 'Unknown'}</span>
                      <span className="text-xs text-white/60">
                        {(moodProfile[key] ?? mood.score ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={moodProfile[key] ?? mood.score ?? 0}
                      onChange={(e) =>
                        setMoodProfile((p) => ({ ...p, [key]: Number(e.target.value) }))
                      }
                      className="w-full accent-white h-2"
                    />
                  </div>
                )
              })}
              <div className="sticky bottom-0 mt-4 w-full flex gap-2 z-[102]">
                <button
                  className="flex-1 bg-white/90 text-black font-bold py-2 rounded shadow-xl hover:bg-white"
                  type="button"
                  onClick={() => {
                    onConfigureMood(moodProfile)
                    setShowAll(false)
                  }}
                >
                  Save profile
                </button>
                <button
                  className="flex-1 bg-black/70 text-white font-bold py-2 rounded shadow-xl hover:bg-black/90 border border-white/20"
                  type="button"
                  onClick={() => {
                    setShowAll(false)
                    setMoodProfile(moodDict)
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
