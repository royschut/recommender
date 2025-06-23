'use client'

import React from 'react'
import { Tabs } from 'radix-ui'
import { MagnifyingGlassIcon, PersonIcon, HeartIcon } from '@radix-ui/react-icons'
import { useRouter, usePathname } from 'next/navigation'
import TabTrigger from '../components/ui/TabTrigger'
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

  return <div className="min-h-screen bg-violet-50 font-sans py-16">{children}</div>

  return (
    <div className="min-h-screen bg-violet-50 font-sans">
      <div className="px-8 pt-2">
        <Tabs.Root className="mx-auto" value={currentTab} onValueChange={handleTabChange}>
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
          </div>
          <div className="min-h-[600px] pb-8">{children}</div>
        </Tabs.Root>
      </div>
    </div>
  )
}

export default PlaygroundLayout
