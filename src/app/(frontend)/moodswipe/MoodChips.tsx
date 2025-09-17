import React from 'react'

export type MoodShape = { title?: string; description?: string; score?: number }

interface MoodChipsProps {
  moods?: unknown
}

export const MoodChips: React.FC<MoodChipsProps> = ({ moods }) => {
  const moodList: MoodShape[] = Array.isArray(moods) ? (moods as MoodShape[]) : []
  const topMoods = moodList
    .slice()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)

  if (topMoods.length === 0) return null

  return (
    <div className="px-2 pt-2 absolute top-2 left-0 right-0 w-full flex flex-col gap-1 items-end z-20">
      {topMoods.map((mood, idx) => (
        <div
          key={mood.title ?? idx}
          className="inline-flex items-center space-x-2 rounded-full bg-black/60 py-1.5 px-3 text-sm text-white/90 drop-shadow-2xl"
          title={mood.description}
        >
          <span className="font-medium">{mood.title ?? 'Unknown'}</span>
          <span className="text-xs text-white/60">{Math.round((mood.score ?? 0) * 100) / 100}</span>
        </div>
      ))}
    </div>
  )
}
