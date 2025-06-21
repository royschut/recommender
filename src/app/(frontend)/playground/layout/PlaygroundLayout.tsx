'use client'

import React from 'react'
import { Tabs } from 'radix-ui'
import { MagnifyingGlassIcon, PersonIcon, HeartIcon } from '@radix-ui/react-icons'
import { useRouter, usePathname } from 'next/navigation'
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
    <div className="playground-container">
      <header className="playground-header">
        <h1 className="playground-title">{playground.title}</h1>
        <p className="playground-subtitle">{playground.subtitle}</p>
      </header>

      <Tabs.Root className="playground-tabs" value={currentTab} onValueChange={handleTabChange}>
        <Tabs.List className="playground-tabs-list" aria-label="Playground navigation">
          <Tabs.Trigger className="playground-tabs-trigger" value="smart-search">
            <MagnifyingGlassIcon className="playground-tabs-icon" />
            <span>{playground.tabs.smartSearch.label}</span>
          </Tabs.Trigger>

          <Tabs.Trigger className="playground-tabs-trigger" value="personal-discovery">
            <PersonIcon className="playground-tabs-icon" />
            <span>{playground.tabs.personalDiscovery.label}</span>
          </Tabs.Trigger>

          <Tabs.Trigger className="playground-tabs-trigger" value="explore-by-taste">
            <HeartIcon className="playground-tabs-icon" />
            <span>{playground.tabs.exploreByTaste.label}</span>
          </Tabs.Trigger>
        </Tabs.List>

        <div className="playground-content">{children}</div>
      </Tabs.Root>
    </div>
  )
}

export default PlaygroundLayout
