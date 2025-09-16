import React, { useState, useCallback, useEffect } from 'react'
import { SwipeDirection } from '../page'

export const useDragListeners = (onSwipe: (direction: SwipeDirection) => void) => {
  const [verticalDragOffset, setVerticalDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null)

  const resetDragState = useCallback(() => {
    setIsDragging(false)
    setVerticalDragOffset(0)
    setSwipeDirection(null)
  }, [])

  const handleMove = useCallback(
    (_currentX: number, currentY: number) => {
      if (!isDragging) return

      const diffY = currentY - startY

      // Only detect vertical swipes
      if (!swipeDirection && Math.abs(diffY) > 10) {
        // Vertical swipe - determine up or down
        setSwipeDirection(diffY > 0 ? 'down' : 'up')
      }

      // Only update vertical offset for all directions
      setVerticalDragOffset(diffY)
    },
    [isDragging, startX, startY, swipeDirection],
  )

  const handleDragEnd = useCallback(() => {
    const threshold = 50

    if (swipeDirection && Math.abs(verticalDragOffset) > threshold) {
      onSwipe(swipeDirection)
    }

    resetDragState()
  }, [swipeDirection, verticalDragOffset, onSwipe, resetDragState])

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
    horizontalDragOffset: 0, // No horizontal dragging anymore
    swipeDirection,
    dragHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleDragEnd,
      onMouseDown: handleMouseStart,
    },
  }
}
