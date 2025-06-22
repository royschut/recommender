'use client'

import React from 'react'
import PlaygroundLayout from '../layout/PlaygroundLayout'
import SmartSearchTab from '../components/SmartSearchTab'

const SmartSearchPage = () => {
  return (
    <PlaygroundLayout activeTab="smart-search">
      <SmartSearchTab />
    </PlaygroundLayout>
  )
}

export default SmartSearchPage
