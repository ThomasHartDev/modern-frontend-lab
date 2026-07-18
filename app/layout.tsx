import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { cssVariablesToRootRule, tokensToCssVariables } from '@/tokens'
import './globals.css'

const tokenRootRule = cssVariablesToRootRule(tokensToCssVariables())

export const metadata: Metadata = {
  title: 'Modern Frontend Lab',
  description:
    'A living reference of modern front-end technique in Next.js 15 and React 19: Server Components, streaming, Suspense, Core Web Vitals, accessibility, and design tokens.'
}

export const viewport: Viewport = {
  themeColor: '#0f1115'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: tokenRootRule }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
