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

export default function AdminPage() {
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
    <div className="admin-container">
      <h1>Film Database Beheer</h1>

      <div className="admin-section">
        <h2>1. Films Importeren</h2>
        <p>Importeer films van The Movie Database (TMDB). De database wordt eerst geleegd.</p>

        <div className="import-controls">
          <label>
            Aantal pagina's:
            <input
              type="number"
              value={pages}
              onChange={(e) => setPages(parseInt(e.target.value) || 1)}
              min="1"
              max="500"
              disabled={importLoading}
            />
          </label>
          <button
            onClick={handleImport}
            disabled={importLoading || pages < 1}
            className="import-button"
          >
            {importLoading
              ? 'Importeren...'
              : `${pages} pagina${pages !== 1 ? 's' : ''} importeren`}
          </button>
        </div>

        {importResult && (
          <div className={`result ${importResult.success ? 'success' : 'error'}`}>
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
              <details>
                <summary>Fouten ({importResult.errors.length})</summary>
                <ul>
                  {importResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="admin-section">
        <h2>2. Embeddings Genereren</h2>
        <p>Genereer AI embeddings voor alle films. De Qdrant database wordt eerst geleegd.</p>

        <button onClick={handleEmbeddings} disabled={embeddingLoading} className="embedding-button">
          {embeddingLoading ? 'Embeddings genereren...' : 'Embeddings genereren'}
        </button>

        {embeddingResult && (
          <div className={`result ${embeddingResult.success ? 'success' : 'error'}`}>
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
              <details>
                <summary>Fouten ({embeddingResult.errors.length})</summary>
                <ul>
                  {embeddingResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="admin-section">
        <h3>✨ Huidige Setup - Clean Architecture</h3>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          <p>
            <strong>✅ Gebruikt Payload Handlers</strong>
          </p>
          <ul style={{ paddingLeft: '20px', margin: '0.5rem 0' }}>
            <li>
              Import: <code>/api/imports</code> → Payload Handler
            </li>
            <li>
              Embeddings: <code>/api/embeddings</code> → Payload Handler
            </li>
            <li>
              Search: <code>/api/search</code> → Next.js API Route
            </li>
          </ul>
          <p>
            <em>Geen code duplicatie, één bron van waarheid per functie!</em>
          </p>
        </div>
      </div>

      <div className="admin-section">
        <h3>Instructies:</h3>
        <ol>
          <li>Eerst films importeren met de gewenste aantal pagina's</li>
          <li>Daarna embeddings genereren voor AI zoekfunctionaliteit</li>
          <li>
            De zoekfunctie is beschikbaar op <a href="/search">/search</a>
          </li>
        </ol>
      </div>

      <style jsx>{`
        .admin-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: system-ui, sans-serif;
        }

        h1 {
          color: #333;
          border-bottom: 2px solid #007bff;
          padding-bottom: 0.5rem;
        }

        .admin-section {
          margin: 2rem 0;
          padding: 1.5rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .admin-section h2 {
          margin-top: 0;
          color: #555;
        }

        .import-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin: 1rem 0;
        }

        .import-controls label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .import-controls input {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 100px;
        }

        .import-button,
        .embedding-button {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .import-button {
          background-color: #28a745;
          color: white;
        }

        .import-button:hover:not(:disabled) {
          background-color: #218838;
        }

        .embedding-button {
          background-color: #007bff;
          color: white;
        }

        .embedding-button:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .import-button:disabled,
        .embedding-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .result {
          margin: 1rem 0;
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid;
        }

        .result.success {
          background-color: #d4edda;
          border-color: #28a745;
          color: #155724;
        }

        .result.error {
          background-color: #f8d7da;
          border-color: #dc3545;
          color: #721c24;
        }

        details {
          margin-top: 0.5rem;
        }

        summary {
          cursor: pointer;
          font-weight: 500;
        }

        ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        li {
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }

        a {
          color: #007bff;
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
