'use client'

import React from 'react'
import { classNames } from '../../utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'soft'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-200'

  const variants = {
    default: 'bg-white border border-gray-300 shadow-sm hover:shadow-md',
    elevated: 'bg-white shadow-md hover:shadow-lg border border-gray-200',
    outline: 'bg-white border-2 border-gray-300 hover:border-gray-400',
    soft: 'bg-violet-50 border border-violet-200 hover:shadow-sm',
  }

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={classNames(baseClasses, variants[variant], paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
