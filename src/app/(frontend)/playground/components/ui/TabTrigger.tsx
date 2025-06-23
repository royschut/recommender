'use client'

import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { classNames } from '../../utils/cn'

interface TabTriggerProps {
  value: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}

const TabTrigger: React.FC<TabTriggerProps> = ({ value, icon, children, className }) => {
  return (
    <Tabs.Trigger
      className={classNames(
        'relative flex items-center gap-3 px-8 py-4 bg-transparent border-none',
        'text-gray-500 text-base font-medium cursor-pointer transition-all duration-300',
        'hover:text-gray-700 hover:-translate-y-0.5',
        'data-[state=active]:text-violet-600',
        'focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2',
        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5',
        'after:bg-transparent after:transition-all after:duration-300',
        'data-[state=active]:after:bg-violet-500',
        className,
      )}
      value={value}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </Tabs.Trigger>
  )
}

export default TabTrigger
