'use client'

import React from 'react'
import PlaygroundLayout from '../layout/PlaygroundLayout'
import Card from '../components/ui/Card'

const PersonalDiscoveryPage = () => {
  return (
    <PlaygroundLayout activeTab="personal-discovery">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Persoonlijke Ontdekkingen</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Ontdek films aangepast aan jouw smaak. We analyseren je voorkeuren en vinden verborgen
            parels die perfect bij je passen.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card variant="soft" padding="lg" className="text-center">
            <div className="text-3xl mb-4">🧠</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Analyse</h3>
            <p className="text-gray-600 text-sm">
              Geavanceerde algoritmes analyseren jouw filmhistorie en voorkeuren
            </p>
          </Card>

          <Card variant="soft" padding="lg" className="text-center">
            <div className="text-3xl mb-4">💎</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verborgen Parels</h3>
            <p className="text-gray-600 text-sm">
              Ontdek films die je anders nooit zou hebben gevonden
            </p>
          </Card>

          <Card variant="soft" padding="lg" className="text-center">
            <div className="text-3xl mb-4">🎪</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Persoonlijk</h3>
            <p className="text-gray-600 text-sm">
              Aanbevelingen die perfect aansluiten bij jouw unieke smaak
            </p>
          </Card>
        </div>

        {/* Coming Soon */}
        <div className="text-center">
          <Card variant="elevated" padding="lg" className="max-w-lg mx-auto">
            <div className="text-4xl mb-4">🚧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Binnenkort Beschikbaar</h3>
            <p className="text-gray-600 mb-4">
              We werken hard aan het perfectioneren van deze functie
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
              In ontwikkeling
            </div>
          </Card>
        </div>
      </div>
    </PlaygroundLayout>
  )
}

export default PersonalDiscoveryPage
