import React, { useState, useCallback } from 'react'
import { SwipeDirection } from '../page'

export const useDragListeners = (onSwipe: (direction: SwipeDirection) => void) => {
  const [verticalDragOffset, setVerticalDragOffset] = useState(0)
  const [horizontalDragOffset, setHorizontalDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSwipping, setIsSwipping] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'horizontal' | 'vertical' | null>(null)

  const resetDragState = useCallback(() => {
    setIsDragging(false)
    setVerticalDragOffset(0)
    setHorizontalDragOffset(0)
    setSwipeDirection(null)
    setIsSwipping(false)
  }, [])

  const handleDragEnd = useCallback(() => {
    const threshold = 50

    if (swipeDirection === 'horizontal' && Math.abs(horizontalDragOffset) > threshold) {
      if (horizontalDragOffset > 0) {
        onSwipe('left')
      } else {
        onSwipe('right')
      }
    } else if (swipeDirection === 'vertical' && Math.abs(verticalDragOffset) > threshold) {
      if (verticalDragOffset > 0) {
        onSwipe('up')
      } else {
        onSwipe('down')
      }
    }

    resetDragState()
  }, [swipeDirection, horizontalDragOffset, verticalDragOffset, onSwipe, resetDragState])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setStartY(e.touches[0].clientY)
    setSwipeDirection(null)
    setIsSwipping(true)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
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
    },
    [isDragging, startX, startY, swipeDirection],
  )

  const handleMouseStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
    setStartY(e.clientY)
    setSwipeDirection(null)
    setIsSwipping(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      const currentX = e.clientX
      const currentY = e.clientY
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
    },
    [isDragging, startX, startY, swipeDirection],
  )

  return {
    verticalDragOffset,
    horizontalDragOffset,
    isSwipping,
    dragHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleDragEnd,
      onMouseDown: handleMouseStart,
      onMouseMove: handleMouseMove,
      onMouseUp: handleDragEnd,
    },
  }
}
