import React from 'react'

interface ArrowKeyProps {
  direction: 'up' | 'down' | 'left' | 'right'
  onClick: () => void
  disabled?: boolean
  className?: string
}

const arrowIcons = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
}

export function ArrowKey({ direction, onClick, disabled = false, className = '' }: ArrowKeyProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-12 h-12
        bg-white/10 hover:bg-white/20 active:bg-white/30
        border border-white/20
        rounded-lg
        flex items-center justify-center
        text-white text-xl font-bold
        transition-all duration-150
        backdrop-blur-sm
        shadow-lg
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      {arrowIcons[direction]}
    </button>
  )
}
