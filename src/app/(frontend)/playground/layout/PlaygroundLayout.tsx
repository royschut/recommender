'use client'

import React from 'react'
import { Tabs } from 'radix-ui'
import { MagnifyingGlassIcon, PersonIcon, HeartIcon } from '@radix-ui/react-icons'
import { useRouter, usePathname } from 'next/navigation'
import TabTrigger from '../components/ui/TabTrigger'
import '../index.css'
import { classNames } from '../utils/cn'

interface PlaygroundLayoutProps {
  children: React.ReactNode
  activeTab?: string
}

const PlaygroundLayout: React.FC<PlaygroundLayoutProps> = ({ children, activeTab }) => {
  const router = useRouter()
  const pathname = usePathname()

  const getCurrentTab = () => {
    if (activeTab) return activeTab
    if (pathname.includes('/smart-search')) return 'smart-search'
    if (pathname.includes('/personal-discovery')) return 'personal-discovery'

    return 'smart-search'
  }

  const currentTab = getCurrentTab()

  const handleTabChange = (value: string) => {
    const routes = {
      'smart-search': '/playground/smart-search',
      'personal-discovery': '/playground/personal-discovery',
    }
    router.push(routes[value as keyof typeof routes] || '/playground')
  }

  return <div className="min-h-screen bg-violet-50 font-sans py-4">{children}</div>

  return (
    <div className="min-h-screen bg-violet-50 font-sans">
      <div className="px-8 pt-2">
        <div className="flex justify-end">
          <Tabs.Root className="" value={currentTab} onValueChange={handleTabChange}>
            <Tabs.List className="flex gap-0">
              <Tabs.Trigger
                className={classNames(
                  'relative flex items-center gap-2 px-2 py-1 bg-transparent border-none',
                  'text-gray-500 text-xs font-medium cursor-pointer transition-colors duration-150',
                  'hover:text-violet-700 hover:bg-violet-50',
                  'data-[state=active]:text-violet-600',
                  'focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2',
                  'rounded-full',
                )}
                value={'smart-search'}
              >
                <MagnifyingGlassIcon />
                <span>{'Smart search'}</span>
              </Tabs.Trigger>
              <Tabs.Trigger
                className={classNames(
                  'relative flex items-center gap-2 px-2 py-1 bg-transparent border-none',
                  'text-gray-500 text-xs font-medium cursor-pointer transition-colors duration-150',
                  'hover:text-violet-700 hover:bg-violet-50',
                  'data-[state=active]:text-violet-600',
                  'focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2',
                  'rounded-full',
                )}
                value={'personal-discovery'}
              >
                <PersonIcon />
                <span>{'Personalised'}</span>
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </div>
        <div className="min-h-[600px] pb-8">{children}</div>
      </div>
    </div>
  )
}

export default PlaygroundLayout
