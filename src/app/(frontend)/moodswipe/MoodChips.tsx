import React, { useState } from 'react'

export type MoodShape = { title?: string; description?: string; score?: number }

interface MoodChipsProps {
  moods?: unknown
}

export const MoodChips: React.FC<MoodChipsProps> = ({ moods }) => {
  const [showAll, setShowAll] = useState(false)
  const moodList: MoodShape[] = Array.isArray(moods) ? (moods as MoodShape[]) : []
  const sortedMoods = moodList.slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const topMoods = sortedMoods.slice(0, 3)

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
          <span>Toon alles</span>
          <span
            aria-hidden="true"
            className="text-white text-base"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0px 1px #fff' }}
          >
            ⚙️
          </span>
        </button>
      </div>
      {/* Overlay voor alle moods */}
      {showAll && (
        <div
          id="ALL"
          className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto"
        >
          {/* Overlay background & blur, scrollable */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in overflow-y-auto" />
          {/* Content box, scrollable */}
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
              style={{ maxHeight: 'calc(100% - 48px)' }}
            >
              <h2 className="text-white text-lg font-bold mb-2 text-center">Alle moods</h2>
              {sortedMoods.map((mood, idx) => (
                <div
                  key={mood.title ?? idx}
                  className="inline-flex items-center space-x-2 rounded-full py-2 px-4 text-base text-white/90 bg-black/60 shadow"
                  title={mood.description}
                >
                  <span className="font-semibold">{mood.title ?? 'Unknown'}</span>
                  <span className="text-xs text-white/60">
                    {Math.round((mood.score ?? 0) * 100) / 100}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
