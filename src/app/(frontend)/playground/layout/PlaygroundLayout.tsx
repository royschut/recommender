'use client'

import React from 'react'
import { Tabs } from 'radix-ui'
import { MagnifyingGlassIcon, PersonIcon, HeartIcon } from '@radix-ui/react-icons'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '../utils/cn'
import TabTrigger from '../components/ui/TabTrigger'
import Card from '../components/ui/Card'
import '../index.css'
import contentData from '../content.json'

interface PlaygroundLayoutProps {
  children: React.ReactNode
  activeTab?: string
}

const content = contentData as {
  playground: {
    title: string
    subtitle: string
    tabs: {
      smartSearch: { label: string; description: string }
      personalDiscovery: { label: string; description: string }
      exploreByTaste: { label: string; description: string }
    }
  }
}

const PlaygroundLayout: React.FC<PlaygroundLayoutProps> = ({ children, activeTab }) => {
  const { playground } = content
  const router = useRouter()
  const pathname = usePathname()

  // Determine current tab from pathname if activeTab not provided
  const getCurrentTab = () => {
    if (activeTab) return activeTab
    if (pathname.includes('/smart-search')) return 'smart-search'
    if (pathname.includes('/personal-discovery')) return 'personal-discovery'
    if (pathname.includes('/explore-by-taste')) return 'explore-by-taste'
    return 'smart-search'
  }

  const currentTab = getCurrentTab()

  const handleTabChange = (value: string) => {
    const routes = {
      'smart-search': '/playground/smart-search',
      'personal-discovery': '/playground/personal-discovery',
      'explore-by-taste': '/playground/explore-by-taste',
    }
    router.push(routes[value as keyof typeof routes] || '/playground')
  }

  return (
    <div className="min-h-screen bg-violet-50 font-sans">
      <div className="px-8 pt-12">
        <Tabs.Root className="max-w-5xl mx-auto" value={currentTab} onValueChange={handleTabChange}>
          {/* Subtle header integrated with tabs */}
          <div className="text-center mb-8">
            <Tabs.List className="flex justify-center gap-8 border-b border-gray-200">
              <TabTrigger value="smart-search" icon={<MagnifyingGlassIcon />}>
                {playground.tabs.smartSearch.label}
              </TabTrigger>

              <TabTrigger value="personal-discovery" icon={<PersonIcon />}>
                {playground.tabs.personalDiscovery.label}
              </TabTrigger>

              <TabTrigger value="explore-by-taste" icon={<HeartIcon />}>
                {playground.tabs.exploreByTaste.label}
              </TabTrigger>
            </Tabs.List>
            <p className="text-xs text-gray-400 mt-4 font-light tracking-wide uppercase">
              {playground.subtitle}
            </p>
          </div>

          <div className="min-h-[600px] pb-8">{children}</div>
        </Tabs.Root>
      </div>
    </div>
  )
}

export default PlaygroundLayout
