import './globals.css'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/lib/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { Navigation } from '@/components/navigation'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { PWAInstaller } from '@/components/pwa/pwa-installer'
import { ClientProviders } from '@/components/providers/client-providers'

// Using system fonts instead of Google Fonts to avoid network issues

export const metadata: Metadata = {
  title: 'PHRM - Personal Health Record Manager',
  description: 'Secure personal health record management with AI-powered insights',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PHRM App'
  },
  applicationName: 'PHRM - Personal Health Record Manager',
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#1E40AF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans pb-16 md:pb-0">
        <AuthProvider>
          <ErrorBoundary>
            <ClientProviders>
              <Navigation />
              <main className="min-h-screen bg-gray-50">
                {children}
              </main>
              <Toaster />
              <PWAInstaller />
            </ClientProviders>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  )
}
