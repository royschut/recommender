import { useEffect } from 'react'
import { SwipeDirection } from '../page'

export const useKeyListeners = (onSwipe: (direction: SwipeDirection) => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          onSwipe('up')
          break
        case 'ArrowDown':
          event.preventDefault()
          onSwipe('down')
          break
        case 'ArrowLeft':
          event.preventDefault()
          onSwipe('left')
          break
        case 'ArrowRight':
          event.preventDefault()
          onSwipe('right')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onSwipe])
}
