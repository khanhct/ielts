import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IELTS Assistant - Speaking Practice',
  description: 'AI-powered IELTS Speaking exam assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

