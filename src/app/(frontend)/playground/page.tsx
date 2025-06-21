'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const Playground = () => {
  const router = useRouter()

  useEffect(() => {
    // Redirect to smart-search as default
    router.push('/playground/smart-search')
  }, [router])

  return (
    <div className="playground-loading">
      <p>Loading playground...</p>
    </div>
  )
}

export default Playground
