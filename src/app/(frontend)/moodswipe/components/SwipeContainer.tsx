'use client'
import React from 'react'

interface SwipeContainerProps<T> {
  movieColumns: T[][]
  currentVerticalIndex: number
  currentHorizontalIndex: number
  verticalDragOffset?: number
  horizontalDragOffset?: number
  renderItem: (item: T, isActive: boolean) => React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function SwipeContainer<T>({
  movieColumns,
  currentVerticalIndex,
  currentHorizontalIndex,
  verticalDragOffset = 0,
  horizontalDragOffset = 0,
  renderItem,
  className = '',
  style = {},
}: SwipeContainerProps<T>) {
  if (!movieColumns || movieColumns.length === 0) return null

  return (
    <div
      className={`absolute w-full h-full overflow-hidden ${className}`}
      style={{ userSelect: 'none', ...style }}
    >
      {movieColumns.map((column, columnIndex) => {
        // Only render the first (and only) column
        if (columnIndex !== 0) return null

        const isActiveColumn = columnIndex === currentHorizontalIndex

        return (
          <div key={columnIndex} className="absolute w-full h-full">
            {column
              .slice(Math.max(0, currentVerticalIndex - 1), currentVerticalIndex + 2)
              .map((item, idx) => {
                const actualIndex = Math.max(0, currentVerticalIndex - 1) + idx
                const isActiveItem = actualIndex === currentVerticalIndex && isActiveColumn
                const verticalOffset =
                  (actualIndex - currentVerticalIndex) * 100 +
                  (verticalDragOffset /
                    (typeof window !== 'undefined' ? window.innerHeight : 600)) *
                    100

                return (
                  <div
                    key={`${columnIndex}-${actualIndex}`}
                    className="absolute w-full h-full"
                    style={{
                      transform: `translateY(${verticalOffset}%)`,
                      transition: verticalDragOffset === 0 ? 'transform 0.2s ease-out' : 'none',
                    }}
                  >
                    {renderItem(item, isActiveItem)}
                  </div>
                )
              })}
          </div>
        )
      })}
    </div>
  )
}
