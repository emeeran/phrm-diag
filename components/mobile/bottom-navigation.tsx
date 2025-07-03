'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  FileText, 
  User, 
  Calendar, 
  BrainCircuit, 
  Users, 
  Bell
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  match: RegExp
}

export function BottomNavigation() {
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  // Only show on mobile devices
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: <Home className="h-5 w-5" />,
      match: /^\/dashboard$/
    },
    {
      href: '/dashboard/records',
      label: 'Records',
      icon: <FileText className="h-5 w-5" />,
      match: /^\/dashboard\/records/
    },
    {
      href: '/dashboard/ai',
      label: 'AI',
      icon: <BrainCircuit className="h-5 w-5" />,
      match: /^\/dashboard\/ai/
    },
    {
      href: '/dashboard/family',
      label: 'Family',
      icon: <Users className="h-5 w-5" />,
      match: /^\/dashboard\/family/
    },
    {
      href: '/dashboard/notifications',
      label: 'Alerts',
      icon: <Bell className="h-5 w-5" />,
      match: /^\/dashboard\/notifications/
    }
  ]

  if (!isMobile) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 py-2 px-4">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2 rounded-md",
              item.match.test(pathname) 
                ? "text-blue-600" 
                : "text-gray-500 hover:text-blue-500"
            )}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
