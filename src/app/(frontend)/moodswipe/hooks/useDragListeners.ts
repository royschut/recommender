import React, { useState, useCallback, useEffect } from 'react'
import { SwipeDirection } from '../page'

export const useDragListeners = (onSwipe: (direction: SwipeDirection) => void) => {
  const [verticalDragOffset, setVerticalDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)

  // Always calculate direction at drag end
  const getDirection = (offset: number): SwipeDirection => (offset > 0 ? 'up' : 'down')

  const handleDragEnd = useCallback(
    (finalY?: number) => {
      const threshold = 50
      const offset = finalY !== undefined ? finalY - startY : verticalDragOffset
      if (Math.abs(offset) > threshold) {
        onSwipe(getDirection(offset))
      }
      setIsDragging(false)
      setVerticalDragOffset(0)
    },
    [verticalDragOffset, startY, onSwipe],
  )

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return
      setVerticalDragOffset(e.touches[0].clientY - startY)
    },
    [isDragging, startY],
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (isDragging && e && e.changedTouches && e.changedTouches.length > 0) {
        handleDragEnd(e.changedTouches[0].clientY)
      } else {
        handleDragEnd()
      }
    },
    [isDragging, handleDragEnd],
  )

  const handleMouseStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setStartY(e.clientY)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      setVerticalDragOffset(e.clientY - startY)
    },
    [isDragging, startY],
  )

  const handleMouseUp = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchend', handleTouchEnd)
      document.addEventListener('touchcancel', handleTouchEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchend', handleTouchEnd)
        document.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchEnd])

  return {
    verticalDragOffset,
    horizontalDragOffset: 0,
    swipeDirection: Math.abs(verticalDragOffset) > 10 ? getDirection(verticalDragOffset) : null,
    dragHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseStart,
    },
  }
}
