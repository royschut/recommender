'use client'
import React from 'react'

interface SwipeContainerProps<T> {
  items: T[]
  currentIndex: number
  onIndexChange: (newIndex: number) => void
  renderItem: (item: T, index: number, isActive: boolean) => React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function SwipeContainer<T>({
  items,
  currentIndex,
  onIndexChange,
  renderItem,
  className = '',
  style = {},
}: SwipeContainerProps<T>) {
  const [dragOffset, setDragOffset] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [startY, setStartY] = React.useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY
    setDragOffset(diff)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)

    const threshold = 100 // minimum swipe distance

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && currentIndex > 0) {
        // Swipe down - go to previous
        onIndexChange(currentIndex - 1)
      } else if (dragOffset < 0 && currentIndex < items.length - 1) {
        // Swipe up - go to next
        onIndexChange(currentIndex + 1)
      }
    }

    setDragOffset(0)
  }

  const handleMouseStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartY(e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const currentY = e.clientY
    const diff = currentY - startY
    setDragOffset(diff)
  }

  const handleMouseEnd = () => {
    setIsDragging(false)

    const threshold = 100

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && currentIndex > 0) {
        onIndexChange(currentIndex - 1)
      } else if (dragOffset < 0 && currentIndex < items.length - 1) {
        onIndexChange(currentIndex + 1)
      }
    }

    setDragOffset(0)
  }

  React.useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (!isDragging) return
      const currentY = e.clientY
      const diff = currentY - startY
      setDragOffset(diff)
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
  }, [isDragging, startY, dragOffset, currentIndex, items.length])

  if (!items || items.length === 0) {
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
      {items.slice(Math.max(0, currentIndex - 1), currentIndex + 2).map((item, idx) => {
        const actualIndex = Math.max(0, currentIndex - 1) + idx
        const isActive = actualIndex === currentIndex
        const baseOffset = (actualIndex - currentIndex) * 100
        const currentOffset = baseOffset + (dragOffset / window.innerHeight) * 100

        return (
          <div
            key={actualIndex}
            className="absolute w-full h-full"
            style={{
              transform: `translateY(${currentOffset}%)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {renderItem(item, actualIndex, isActive)}
          </div>
        )
      })}
    </div>
  )
}
