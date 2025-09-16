import React, { useState, useCallback, useEffect } from 'react'
import { SwipeDirection } from '../page'

export const useDragListeners = (onSwipe: (direction: SwipeDirection) => void) => {
  const [verticalDragOffset, setVerticalDragOffset] = useState(0)
  const [horizontalDragOffset, setHorizontalDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null)

  const resetDragState = useCallback(() => {
    setIsDragging(false)
    setVerticalDragOffset(0)
    setHorizontalDragOffset(0)
    setSwipeDirection(null)
  }, [])

  const handleMove = useCallback(
    (currentX: number, currentY: number) => {
      if (!isDragging) return

      const diffX = currentX - startX
      const diffY = currentY - startY

      // Determine swipe direction on first significant movement
      if (!swipeDirection && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          // Horizontal swipe - determine left or right
          setSwipeDirection(diffX > 0 ? 'left' : 'right')
        } else {
          // Vertical swipe - determine up or down
          setSwipeDirection(diffY > 0 ? 'up' : 'down')
        }
      }

      // Update offset based on direction
      if (swipeDirection === 'left' || swipeDirection === 'right') {
        setHorizontalDragOffset(diffX)
        setVerticalDragOffset(0)
      } else if (swipeDirection === 'up' || swipeDirection === 'down') {
        setVerticalDragOffset(diffY)
        setHorizontalDragOffset(0)
      }
    },
    [isDragging, startX, startY, swipeDirection],
  )

  const handleDragEnd = useCallback(() => {
    const threshold = 50

    if (
      swipeDirection &&
      (swipeDirection === 'left' || swipeDirection === 'right') &&
      Math.abs(horizontalDragOffset) > threshold
    ) {
      onSwipe(swipeDirection)
    } else if (
      swipeDirection &&
      (swipeDirection === 'up' || swipeDirection === 'down') &&
      Math.abs(verticalDragOffset) > threshold
    ) {
      onSwipe(swipeDirection)
    }

    resetDragState()
  }, [swipeDirection, horizontalDragOffset, verticalDragOffset, onSwipe, resetDragState])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setStartY(e.touches[0].clientY)
    setSwipeDirection(null)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    },
    [handleMove],
  )

  const handleMouseStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
    setStartY(e.clientY)
    setSwipeDirection(null)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    },
    [handleMove],
  )

  const handleMouseUp = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return {
    verticalDragOffset,
    horizontalDragOffset,
    swipeDirection,
    dragHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleDragEnd,
      onMouseDown: handleMouseStart,
    },
  }
}
