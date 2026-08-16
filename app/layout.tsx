import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { themeBootstrapScript, themesToStyleSheet } from '@/tokens'
import './globals.css'

const tokenStyleSheet = themesToStyleSheet()
const bootstrapScript = themeBootstrapScript()

export const metadata: Metadata = {
  title: 'Modern Frontend Lab',
  description:
    'A living reference of modern front-end technique in Next.js 15 and React 19: Server Components, streaming, Suspense, Core Web Vitals, accessibility, and design tokens.'
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1115' }
  ]
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: tokenStyleSheet }} />
        <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
