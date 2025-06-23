'use client'

import React, { useState } from 'react'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { classNames } from '../../utils/cn'
import Input from './Input'

interface SearchBoxProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
  autoFocus?: boolean
}

const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = 'Search...',
  onSearch,
  className,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit} className={classNames('relative', className)}>
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-10 pointer-events-none" />
      <Input
        variant="search"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        fullWidth
        autoFocus={autoFocus}
      />
    </form>
  )
}

export default SearchBox
