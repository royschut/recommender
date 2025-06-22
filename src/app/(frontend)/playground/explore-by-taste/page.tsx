'use client'

import React from 'react'
import PlaygroundLayout from '../layout/PlaygroundLayout'
import ExploreTab from '../components/ExploreTab'
import '../index.css'

const ExploreByTastePage = () => {
  return (
    <PlaygroundLayout activeTab="explore-by-taste">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-6">💫</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Verken op Smaak</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Pas je filmvoorkeuren aan met onze intelligente sliders en ontdek films die perfect bij
            jouw smaak passen.
          </p>
        </div>

        {/* Explore Tab Component */}
        <ExploreTab />
      </div>
    </PlaygroundLayout>
  )
}

export default ExploreByTastePage
