import React from 'react'

interface SwipeIndicatorProps {
  direction: 'up' | 'down' | 'left' | 'right'
  icon?: React.ReactNode
  label: string
  className?: string
}

export function SwipeIndicator({ direction, icon, label, className = '' }: SwipeIndicatorProps) {
  const isVertical = direction === 'left' || direction === 'right'

  // Position classes based on direction
  const getPositionClass = () => {
    switch (direction) {
      case 'down':
        return 'absolute bottom-0 left-0 right-0 flex justify-center items-center'
      case 'left':
        return 'absolute left-0 top-1/2 -translate-y-1/2 flex justify-start items-center'
      case 'right':
        return 'absolute right-0 top-1/2 -translate-y-1/2 flex justify-end items-center'
      default:
        return 'flex justify-center items-center'
    }
  }

  // Content alignment based on direction
  const getContentAlignment = () => {
    switch (direction) {
      case 'left':
        return 'items-start'
      case 'right':
        return 'items-end'
      default:
        return 'items-center'
    }
  }

  const filter =
    'drop-shadow(rgba(0,0,0,0.8) 1px 1px 1px) drop-shadow(rgba(0,0,0,0.8) -1px -1px 1px) drop-shadow(rgba(0,0,0,1) 0px 0px 10px) drop-shadow(rgba(0,0,0,0.5) 0px 0px 15px) drop-shadow(rgba(0,0,0,0.5) 0px 0px 100px) '

  return (
    <div className={`${getPositionClass()} text-white/70 pointer-events-none z-10 ${className}`}>
      <div className={`${direction === 'down' ? 'px-4' : 'px-3'} py-3`}>
        <div
          className={`flex ${isVertical ? `flex-col ${getContentAlignment()} space-y-1` : 'items-center space-x-2'}`}
        >
          <div style={{ filter }}>{icon}</div>
          <span className="text-xs text-white font-medium" style={{ filter }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}
