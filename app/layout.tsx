import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { Navigation } from '@/components/navigation'
import { ErrorBoundary } from '@/components/ui/error-boundary'

// Using system fonts instead of Google Fonts to avoid network issues

export const metadata: Metadata = {
  title: 'PHRM - Personal Health Record Manager',
  description: 'Secure personal health record management with AI-powered insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <ErrorBoundary>
            <Navigation />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
            <Toaster />
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  )
}
