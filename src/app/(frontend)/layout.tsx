'use client'

import React, { useState } from 'react'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default async function RootLayout(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const { children } = props

  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body className={GeistSans.className}>
          <main>{children}</main>
        </body>
      </html>
    </QueryClientProvider>
  )
}
