'use client'

import React from 'react'
import { classNames } from '../../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-4 font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-violet-8 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-violet-9 text-white hover:bg-violet-10 active:bg-violet-11 shadow-2 hover:shadow-3',
    secondary: 'bg-gray-3 text-gray-11 hover:bg-gray-4 hover:text-gray-12 active:bg-gray-5',
    ghost: 'text-gray-11 hover:bg-gray-3 hover:text-gray-12 active:bg-gray-4',
    outline:
      'border border-gray-6 bg-white text-gray-11 hover:bg-gray-2 hover:border-gray-7 active:bg-gray-3',
  }

  const sizes = {
    sm: 'px-3 py-2 text-2xs gap-2',
    md: 'px-4 py-3 text-sm gap-2',
    lg: 'px-6 py-4 text-base gap-3',
  }

  return (
    <button
      className={classNames(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
