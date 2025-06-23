'use client'

import React from 'react'
import { classNames } from '../../utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search'
  error?: boolean
  fullWidth?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', error = false, fullWidth = false, className, ...props }, ref) => {
    const baseClasses =
      'px-3 py-2 text-sm bg-white border rounded-lg transition-all duration-200 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-violet-8 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      default: 'border-gray-6 hover:border-gray-7 focus:border-violet-8',
      search: 'border-gray-6 hover:border-gray-7 focus:border-violet-8 pl-10',
    }

    const errorClasses = error ? 'border-red-8 focus:border-red-8 focus:ring-red-8' : ''

    const widthClasses = fullWidth ? 'w-full' : ''

    return (
      <input
        ref={ref}
        className={classNames(
          baseClasses,
          variants[variant],
          errorClasses,
          widthClasses,
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export default Input
