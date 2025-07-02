"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Heart, LogOut, Settings, User } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">PHRM</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dashboard/records" className="text-gray-600 hover:text-gray-900">
                Health Records
              </Link>
              <Link href="/dashboard/ai" className="text-gray-600 hover:text-gray-900">
                AI Insights
              </Link>
              <Link href="/dashboard/family" className="text-gray-600 hover:text-gray-900">
                Family
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              Welcome, {user.name || user.email}
            </span>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
