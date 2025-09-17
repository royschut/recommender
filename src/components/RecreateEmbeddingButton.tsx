'use client'
import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const RecreateEmbeddingButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { id } = useDocumentInfo()

  const handleClick = async () => {
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/moods/recreate-embedding/${id}`, { method: 'POST' })

      if (res.ok) {
        setMessage('✅ Embedding recreated!')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage('❌ Error occurred')
      }
    } catch {
      setMessage('❌ Error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: loading ? '#666' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Creating...' : 'Recreate Embedding'}
      </button>
      {message && <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>{message}</p>}
    </div>
  )
}
