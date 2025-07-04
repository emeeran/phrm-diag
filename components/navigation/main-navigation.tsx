'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  FileText, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Activity,
  AlertCircle,
  Bell,
  BarChart,
  Shield,
  Sparkles
} from 'lucide-react';

interface NavigationProps {
  type?: 'main' | 'dashboard';
  className?: string;
}

/**
 * Unified navigation component that handles both main and dashboard navigation
 */
export function MainNavigation({ type = 'main', className }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) {
    return null; // Don't show navigation if not authenticated
  }

  // Define navigation items based on type
  const navigation = type === 'main' ? [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Health Records", href: "/dashboard/records", icon: FileText },
    { name: "AI Assistant", href: "/dashboard/ai", icon: MessageSquare },
    { name: "Family", href: "/dashboard/family", icon: Users },
    { name: "Emergency", href: "/dashboard/emergency", icon: AlertCircle },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ] : [
    // Dashboard navigation has more detailed options
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Records", href: "/dashboard/records", icon: FileText },
    { name: "Analysis", href: "/dashboard/health-analysis", icon: Activity },
    { name: "AI", href: "/dashboard/ai", icon: MessageSquare },
    { name: "Family", href: "/dashboard/family", icon: Users },
    { name: "Emergency", href: "/dashboard/emergency", icon: AlertCircle },
    { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart },
    { name: "Predictive", href: "/dashboard/predictive", icon: Sparkles },
    { name: "Security", href: "/dashboard/security", icon: Shield },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('')
    : '?';

  return (
    <nav className={cn("bg-background border-b", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/dashboard" className="text-xl font-bold text-primary">
                PHRM-Diag
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive(item.href)
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground",
                    "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <span className="flex items-center">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <span className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              className="inline-flex items-center justify-center rounded-md p-2"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive(item.href)
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted",
                  "block border-l-4 py-2 pl-3 pr-4 text-base font-medium"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-200 pb-3 pt-4">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-foreground">
                  {session.user?.name}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {session.user?.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/dashboard/profile"
                className="block px-4 py-2 text-base font-medium text-muted-foreground hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                className="block px-4 py-2 text-base font-medium text-muted-foreground hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-destructive hover:bg-muted"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
