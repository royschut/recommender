'use client'

import React from 'react'
import { cn } from '../../utils/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  children: React.ReactNode
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'

  const variants = {
    default: 'bg-gray-3 text-gray-11',
    primary: 'bg-violet-3 text-violet-11',
    secondary: 'bg-blue-3 text-blue-11',
    success: 'bg-green-3 text-green-11',
    warning: 'bg-yellow-3 text-yellow-11',
    error: 'bg-red-3 text-red-11',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span className={cn(baseClasses, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  )
}

export default Badge
