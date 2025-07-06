'use client'

import React, { useEffect, useState } from 'react'
import { classNames } from './utils/cn'
import { ToggleGroup } from 'radix-ui'
import { MagnifyingGlassIcon, PersonIcon } from '@radix-ui/react-icons'
import SmartSearch from './components/SmartSearch'
import Personalised from './components/Personalised'
import { FavoritesProvider } from './components/FavoritesContext'

const Playground = () => {
  const [isPersonalised, setIsPersonalised] = useState(false)

  const [visibleSections, setVisibleSections] = useState<number[]>([])

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setVisibleSections((prev) => [...prev, 0]), 200),
      setTimeout(() => setVisibleSections((prev) => [...prev, 1]), 1500),
      setTimeout(() => setVisibleSections((prev) => [...prev, 2]), 2500),
      setTimeout(() => setVisibleSections((prev) => [...prev, 3]), 3000),
    ]

    return () => timeouts.forEach(clearTimeout)
  }, [])

  const fadeStyle = (timing: number, includeY = true, duration = 700, excludeTiming = -1) => {
    return classNames(
      `transition-all duration-${duration} transform-y-200 ease-out `,
      `${visibleSections.includes(timing) && !visibleSections.includes(excludeTiming) ? 'opacity-100' : 'opacity-0'}`,
      includeY ? `${visibleSections.includes(timing) ? 'translate-y-0' : 'translate-y-8'}` : '',
    )
  }

  const mainContent = isPersonalised ? <Personalised /> : <SmartSearch />

  return (
    <FavoritesProvider>
      <div className="min-h-screen bg-[#f7f7fb] font-sans py-4">
        <div className="flex items-center justify-end mt-2 mb-6 px-4">
          <ToggleGroup.Root
            type="single"
            value={isPersonalised ? 'personalised' : 'smart-search'}
            className={classNames(
              'inline-flex gap-1 rounded-full bg-violet-50 p-1 shadow-inner',
              fadeStyle(2, false),
            )}
            onValueChange={(value) => setIsPersonalised(value === 'personalised')}
          >
            <ToggleGroup.Item
              value="smart-search"
              className={classNames(
                'flex gap-1 items-center px-4 py-1 text-sm rounded-full transition-colors cursor-pointer',
                !isPersonalised
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:bg-violet-100 hover:text-violet-700',
              )}
            >
              <MagnifyingGlassIcon />
              {'Smart Explore'}
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="personalised"
              className={classNames(
                'flex gap-1 items-center px-4 py-1 text-sm rounded-full transition-colors cursor-pointer',
                isPersonalised
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:bg-violet-100 hover:text-violet-700',
              )}
            >
              <PersonIcon />
              {'Personal Mode'}
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </div>
        {mainContent}
      </div>
    </FavoritesProvider>
  )
}

export default Playground
