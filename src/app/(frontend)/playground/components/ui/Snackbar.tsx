'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircledIcon, Cross2Icon, InfoCircledIcon } from '@radix-ui/react-icons'
import { cn } from '../../utils/cn'

interface SnackbarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
  icon?: React.ReactNode
  duration?: number
  variant?: 'info' | 'success' | 'warning' | 'error'
}

const Snackbar: React.FC<SnackbarProps> = ({
  open,
  onOpenChange,
  message,
  icon,
  duration = 4000,
  variant = 'info',
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onOpenChange(false), 300) // Wait for animation
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [open, duration, onOpenChange])

  if (!open) return null

  const variants = {
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    error: 'bg-red-600 text-white',
  }

  const defaultIcons = {
    info: <InfoCircledIcon className="w-5 h-5" />,
    success: <CheckCircledIcon className="w-5 h-5" />,
    warning: <InfoCircledIcon className="w-5 h-5" />,
    error: <Cross2Icon className="w-5 h-5" />,
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50',
        'max-w-md px-4 py-3 rounded-xl shadow-lg',
        'flex items-center gap-3',
        'transition-all duration-300 ease-out',
        variants[variant],
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95'
      )}
    >
      {icon || defaultIcons[variant]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onOpenChange(false), 300)
        }}
        className="text-white/80 hover:text-white transition-colors p-1"
      >
        <Cross2Icon className="w-4 h-4" />
      </button>
    </div>
  )
}

export default Snackbar
