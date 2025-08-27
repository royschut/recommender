'use client'
import React from 'react'

interface SwipeContainerProps<T> {
  movieColumns: T[][]
  currentVerticalIndex: number
  currentHorizontalIndex: number
  onVerticalIndexChange: (newIndex: number) => void
  onHorizontalIndexChange: (newIndex: number) => void
  renderItem: (item: T, index: number, isActive: boolean) => React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function SwipeContainer<T>({
  movieColumns,
  currentVerticalIndex,
  currentHorizontalIndex,
  onVerticalIndexChange,
  onHorizontalIndexChange,
  renderItem,
  className = '',
  style = {},
}: SwipeContainerProps<T>) {
  const [verticalDragOffset, setVerticalDragOffset] = React.useState(0)
  const [horizontalDragOffset, setHorizontalDragOffset] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [startX, setStartX] = React.useState(0)
  const [startY, setStartY] = React.useState(0)
  const [swipeDirection, setSwipeDirection] = React.useState<'horizontal' | 'vertical' | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setStartY(e.touches[0].clientY)
    setSwipeDirection(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = currentX - startX
    const diffY = currentY - startY

    // Determine swipe direction on first significant movement
    if (!swipeDirection && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        setSwipeDirection('horizontal')
      } else {
        setSwipeDirection('vertical')
      }
    }

    // Update offset based on direction
    if (swipeDirection === 'horizontal') {
      setHorizontalDragOffset(diffX)
      setVerticalDragOffset(0)
    } else if (swipeDirection === 'vertical') {
      setVerticalDragOffset(diffY)
      setHorizontalDragOffset(0)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    const threshold = 50 // Reduced from 100 for quicker response

    if (swipeDirection === 'horizontal' && Math.abs(horizontalDragOffset) > threshold) {
      if (horizontalDragOffset > 0 && currentHorizontalIndex > 0) {
        // Swipe right - go to left column
        onHorizontalIndexChange(currentHorizontalIndex - 1)
      } else if (horizontalDragOffset < 0 && currentHorizontalIndex < movieColumns.length - 1) {
        // Swipe left - go to right column
        onHorizontalIndexChange(currentHorizontalIndex + 1)
      }
    } else if (swipeDirection === 'vertical' && Math.abs(verticalDragOffset) > threshold) {
      const currentColumn = movieColumns[currentHorizontalIndex]
      if (verticalDragOffset > 0 && currentVerticalIndex > 0) {
        // Swipe down - go to previous
        onVerticalIndexChange(currentVerticalIndex - 1)
      } else if (verticalDragOffset < 0 && currentVerticalIndex < currentColumn.length - 1) {
        // Swipe up - go to next
        onVerticalIndexChange(currentVerticalIndex + 1)
      }
    }

    setVerticalDragOffset(0)
    setHorizontalDragOffset(0)
    setSwipeDirection(null)
  }

  const handleMouseStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
    setStartY(e.clientY)
    setSwipeDirection(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const currentX = e.clientX
    const currentY = e.clientY
    const diffX = currentX - startX
    const diffY = currentY - startY

    if (!swipeDirection && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        setSwipeDirection('horizontal')
      } else {
        setSwipeDirection('vertical')
      }
    }

    if (swipeDirection === 'horizontal') {
      setHorizontalDragOffset(diffX)
      setVerticalDragOffset(0)
    } else if (swipeDirection === 'vertical') {
      setVerticalDragOffset(diffY)
      setHorizontalDragOffset(0)
    }
  }

  const handleMouseEnd = () => {
    setIsDragging(false)
    const threshold = 50 // Reduced from 100 for quicker response

    if (swipeDirection === 'horizontal' && Math.abs(horizontalDragOffset) > threshold) {
      if (horizontalDragOffset > 0 && currentHorizontalIndex > 0) {
        onHorizontalIndexChange(currentHorizontalIndex - 1)
      } else if (horizontalDragOffset < 0 && currentHorizontalIndex < movieColumns.length - 1) {
        onHorizontalIndexChange(currentHorizontalIndex + 1)
      }
    } else if (swipeDirection === 'vertical' && Math.abs(verticalDragOffset) > threshold) {
      const currentColumn = movieColumns[currentHorizontalIndex]
      if (verticalDragOffset > 0 && currentVerticalIndex > 0) {
        onVerticalIndexChange(currentVerticalIndex - 1)
      } else if (verticalDragOffset < 0 && currentVerticalIndex < currentColumn.length - 1) {
        onVerticalIndexChange(currentVerticalIndex + 1)
      }
    }

    setVerticalDragOffset(0)
    setHorizontalDragOffset(0)
    setSwipeDirection(null)
  }

  React.useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (!isDragging) return
      const currentX = e.clientX
      const currentY = e.clientY
      const diffX = currentX - startX
      const diffY = currentY - startY

      if (!swipeDirection && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          setSwipeDirection('horizontal')
        } else {
          setSwipeDirection('vertical')
        }
      }

      if (swipeDirection === 'horizontal') {
        setHorizontalDragOffset(diffX)
        setVerticalDragOffset(0)
      } else if (swipeDirection === 'vertical') {
        setVerticalDragOffset(diffY)
        setHorizontalDragOffset(0)
      }
    }

    const handleMouseUpGlobal = () => {
      if (isDragging) {
        handleMouseEnd()
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMoveGlobal)
      document.addEventListener('mouseup', handleMouseUpGlobal)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal)
      document.removeEventListener('mouseup', handleMouseUpGlobal)
    }
  }, [
    isDragging,
    startX,
    startY,
    swipeDirection,
    horizontalDragOffset,
    verticalDragOffset,
    currentHorizontalIndex,
    currentVerticalIndex,
    movieColumns.length,
  ])

  if (!movieColumns || movieColumns.length === 0) {
    return null
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseStart}
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={handleMouseEnd}
      style={{ userSelect: 'none', ...style }}
    >
      {/* Render 3 horizontal columns */}
      {movieColumns.map((column, columnIndex) => {
        const isActiveColumn = columnIndex === currentHorizontalIndex
        const columnOffset =
          (columnIndex - currentHorizontalIndex) * 100 +
          (horizontalDragOffset / window.innerWidth) * 100

        return (
          <div
            key={columnIndex}
            className="absolute w-full h-full"
            style={{
              transform: `translateX(${columnOffset}%)`,
              transition:
                isDragging && swipeDirection === 'horizontal' ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Render vertical items within this column */}
            {column
              .slice(Math.max(0, currentVerticalIndex - 1), currentVerticalIndex + 2)
              .map((item, idx) => {
                const actualIndex = Math.max(0, currentVerticalIndex - 1) + idx
                const isActiveItem = actualIndex === currentVerticalIndex && isActiveColumn
                const verticalOffset =
                  (actualIndex - currentVerticalIndex) * 100 +
                  (swipeDirection === 'vertical'
                    ? (verticalDragOffset / window.innerHeight) * 100
                    : 0)

                return (
                  <div
                    key={`${columnIndex}-${actualIndex}`}
                    className="absolute w-full h-full"
                    style={{
                      transform: `translateY(${verticalOffset}%)`,
                      transition:
                        isDragging && swipeDirection === 'vertical'
                          ? 'none'
                          : 'transform 0.1s ease-out',
                    }}
                  >
                    {renderItem(item, actualIndex, isActiveItem)}
                  </div>
                )
              })}
          </div>
        )
      })}
    </div>
  )
}
