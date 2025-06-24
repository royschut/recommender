'use client'

import React from 'react'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './styles.css'
import { QueryProvider } from './QueryProvider'

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <QueryProvider>
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body className={GeistSans.className}>
          <main>{children}</main>
        </body>
      </html>
    </QueryProvider>
  )
}
