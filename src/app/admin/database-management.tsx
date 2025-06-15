'use client'

import React, { useState } from 'react'

interface ImportResponse {
  success: boolean
  message: string
  totalImported: number
  pagesImported: number
  errors?: string[]
}

interface EmbeddingResponse {
  success: boolean
  message: string
  totalMovies: number
  totalProcessed: number
  totalErrors: number
  errors?: string[]
}

const DatabaseManagement: React.FC = () => {
  const [importLoading, setImportLoading] = useState(false)
  const [embeddingLoading, setEmbeddingLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [embeddingResult, setEmbeddingResult] = useState<EmbeddingResponse | null>(null)
  const [pages, setPages] = useState(10)

  const handleImport = async () => {
    setImportLoading(true)
    setImportResult(null)

    try {
      const response = await fetch(`/api/imports?pages=${pages}`)
      const data: ImportResponse = await response.json()
      setImportResult(data)
    } catch (error: any) {
      setImportResult({
        success: false,
        message: error.message || 'Er is een fout opgetreden',
        totalImported: 0,
        pagesImported: 0,
      })
    } finally {
      setImportLoading(false)
    }
  }

  const handleEmbeddings = async () => {
    setEmbeddingLoading(true)
    setEmbeddingResult(null)

    try {
      const response = await fetch('/api/embeddings')
      const data: EmbeddingResponse = await response.json()
      setEmbeddingResult(data)
    } catch (error: any) {
      setEmbeddingResult({
        success: false,
        message: error.message || 'Er is een fout opgetreden',
        totalMovies: 0,
        totalProcessed: 0,
        totalErrors: 0,
      })
    } finally {
      setEmbeddingLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>Database Beheer</h2>

      <div
        style={{
          marginBottom: '30px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3>1. Films Importeren</h3>
        <p>Importeer films van The Movie Database (TMDB). De database wordt eerst geleegd.</p>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', margin: '15px 0' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            Aantal pagina's:
            <input
              type="number"
              value={pages}
              onChange={(e) => setPages(parseInt(e.target.value) || 1)}
              min="1"
              max="500"
              disabled={importLoading}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100px',
              }}
            />
          </label>
          <button
            onClick={handleImport}
            disabled={importLoading || pages < 1}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: importLoading ? 'not-allowed' : 'pointer',
              opacity: importLoading ? 0.6 : 1,
            }}
          >
            {importLoading
              ? 'Importeren...'
              : `${pages} pagina${pages !== 1 ? 's' : ''} importeren`}
          </button>
        </div>

        {importResult && (
          <div
            style={{
              padding: '15px',
              borderRadius: '6px',
              borderLeft: '4px solid',
              backgroundColor: importResult.success ? '#d4edda' : '#f8d7da',
              borderColor: importResult.success ? '#28a745' : '#dc3545',
              color: importResult.success ? '#155724' : '#721c24',
            }}
          >
            <p>
              <strong>{importResult.message}</strong>
            </p>
            {importResult.success && (
              <p>
                ✅ {importResult.totalImported} films geïmporteerd van {importResult.pagesImported}{' '}
                pagina's
              </p>
            )}
            {importResult.errors && importResult.errors.length > 0 && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Fouten ({importResult.errors.length})
                </summary>
                <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                  {importResult.errors.map((error, index) => (
                    <li key={index} style={{ margin: '5px 0', fontSize: '14px' }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginBottom: '30px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3>2. Embeddings Genereren</h3>
        <p>Genereer AI embeddings voor alle films. De Qdrant database wordt eerst geleegd.</p>

        <button
          onClick={handleEmbeddings}
          disabled={embeddingLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: embeddingLoading ? 'not-allowed' : 'pointer',
            opacity: embeddingLoading ? 0.6 : 1,
          }}
        >
          {embeddingLoading ? 'Embeddings genereren...' : 'Embeddings genereren'}
        </button>

        {embeddingResult && (
          <div
            style={{
              padding: '15px',
              borderRadius: '6px',
              borderLeft: '4px solid',
              backgroundColor: embeddingResult.success ? '#d4edda' : '#f8d7da',
              borderColor: embeddingResult.success ? '#28a745' : '#dc3545',
              color: embeddingResult.success ? '#155724' : '#721c24',
              marginTop: '15px',
            }}
          >
            <p>
              <strong>{embeddingResult.message}</strong>
            </p>
            {embeddingResult.success && (
              <p>
                ✅ {embeddingResult.totalProcessed} van {embeddingResult.totalMovies} films verwerkt
              </p>
            )}
            {embeddingResult.totalErrors > 0 && (
              <p>⚠️ {embeddingResult.totalErrors} fouten opgetreden</p>
            )}
            {embeddingResult.errors && embeddingResult.errors.length > 0 && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Fouten ({embeddingResult.errors.length})
                </summary>
                <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                  {embeddingResult.errors.map((error, index) => (
                    <li key={index} style={{ margin: '5px 0', fontSize: '14px' }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#e9ecef',
        }}
      >
        <h3>Instructies:</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Eerst films importeren met de gewenste aantal pagina's</li>
          <li>Daarna embeddings genereren voor AI zoekfunctionaliteit</li>
          <li>De zoekfunctie is beschikbaar op de frontend</li>
        </ol>
      </div>
    </div>
  )
}

export default DatabaseManagement
