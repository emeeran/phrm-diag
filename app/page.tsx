import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Shield, Users, Zap } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">PHRM</span>
          </div>
          <div className="space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Health,{' '}
            <span className="text-blue-600">AI-Powered</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Securely manage your family's health records with intelligent AI insights. 
            Get personalized health recommendations while keeping your data private.
          </p>
          <div className="space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="px-8 py-3">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Privacy First</CardTitle>
              <CardDescription>
                Your health data stays secure with end-to-end encryption and local AI processing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Get intelligent health recommendations powered by hybrid AI technology
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Family Management</CardTitle>
              <CardDescription>
                Manage health records for your entire family with granular permissions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Comprehensive Care</CardTitle>
              <CardDescription>
                Track symptoms, medications, appointments, and health trends in one place
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to take control of your health?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of families already using PHRM to manage their health records.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="px-8 py-3">
              Get Started Today
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 PHRM. All rights reserved. HIPAA Compliant.</p>
        </div>
      </footer>
    </div>
  )
}
