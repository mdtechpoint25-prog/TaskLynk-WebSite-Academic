"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationBell } from '@/components/notification-bell';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LogOut, Star, User, Settings, DollarSign, Menu, X, ChevronDown } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type DashboardNavContentProps = {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
};

function DashboardNavContent({ onMenuClick, sidebarOpen = false }: DashboardNavContentProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  // NEW: internal sidebar state so the icon reflects open/close even when not controlled by props
  const [internalSidebarOpen, setInternalSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync internal sidebar state with global toggle events when the parent doesn't control it
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const toggleHandler = () => setInternalSidebarOpen((v) => !v);
    const openHandler = () => setInternalSidebarOpen(true);
    const closeHandler = () => setInternalSidebarOpen(false);
    window.addEventListener('toggle-sidebar', toggleHandler as EventListener);
    window.addEventListener('open-sidebar', openHandler as EventListener);
    window.addEventListener('close-sidebar', closeHandler as EventListener);
    return () => {
      window.removeEventListener('toggle-sidebar', toggleHandler as EventListener);
      window.removeEventListener('open-sidebar', openHandler as EventListener);
      window.removeEventListener('close-sidebar', closeHandler as EventListener);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Derive a readable page title from the current route
  const pageTitle = useMemo(() => {
    if (!pathname) return '';

    // Freelancer routes
    if (pathname.startsWith('/freelancer')) {
      if (pathname === '/freelancer/dashboard') return 'Overview';
      if (pathname.startsWith('/freelancer/orders')) return 'Available Orders';
      if (pathname.startsWith('/freelancer/bids')) return 'My Bids';
      if (pathname.startsWith('/freelancer/jobs')) {
        const status = (searchParams.get('status') || '').replace('-', ' ');
        if (pathname.match(/^\/freelancer\/jobs\/[0-9]+/)) return 'Job Detail';
        return status ? `My Jobs • ${status.replace(/\b\w/g, c => c.toUpperCase())}` : 'My Jobs';
      }
      if (pathname.startsWith('/freelancer/messages')) return 'Messages';
      if (pathname.startsWith('/freelancer/guide')) return 'Guide';
      if (pathname.startsWith('/freelancer/financial-overview')) return 'Financial Overview';
      if (pathname.startsWith('/freelancer/settings')) return 'Settings';
    }

    // Client routes
    if (pathname.startsWith('/client')) {
      if (pathname === '/client/dashboard') return 'Client Overview';
      if (pathname.startsWith('/client/new-job')) return 'Post a Job';
      if (pathname.startsWith('/client/jobs')) return pathname.match(/^\/client\/jobs\/[0-9]+/) ? 'Order Detail' : 'My Orders';
      if (pathname.startsWith('/client/messages')) return 'Messages';
      if (pathname.startsWith('/client/settings')) return 'Settings';
    }

    // Admin routes
    if (pathname.startsWith('/admin')) {
      if (pathname.startsWith('/admin/dashboard')) return 'Admin Dashboard';
      if (pathname.startsWith('/admin/jobs')) return pathname.match(/^\/admin\/jobs\/[0-9]+/) ? 'Manage Job' : 'Manage Jobs';
      if (pathname.startsWith('/admin/users')) return 'Manage Users';
      if (pathname.startsWith('/admin/messages')) return 'Admin Messages';
      if (pathname.startsWith('/admin/invoices') || pathname.startsWith('/admin/payments')) return 'Manage Invoices';
    }

    // Manager routes
    if (pathname.startsWith('/manager')) {
      if (pathname === '/manager/dashboard') return 'Manager Overview';
      if (pathname.startsWith('/manager/orders')) return 'Orders';
      if (pathname.startsWith('/manager/clients')) return 'Clients';
      if (pathname.startsWith('/manager/writers')) return 'Writers';
      if (pathname.startsWith('/manager/settings')) return 'Settings';
    }

    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/profile')) return 'Profile';

    // Fallback: Title Case last segment
    const parts = pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    return last.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }, [pathname, searchParams]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Determine dashboard path based on user role
  const dashboardPath = 
    user.role === 'admin' ? '/admin/dashboard' :
    user.role === 'manager' ? '/manager/dashboard' :
    user.role === 'client' || user.role === 'account_owner' ? '/client/dashboard' :
    user.role === 'freelancer' ? '/freelancer/dashboard' : '/';

  // Compute settings path by role
  const settingsPath = 
    user.role === 'freelancer' ? '/freelancer/settings' : 
    user.role === 'client' || user.role === 'account_owner' ? '/client/settings' : 
    user.role === 'manager' ? '/manager/settings' : 
    user.role === 'admin' ? '/admin/settings' :
    '/settings';

  // Use controlled sidebar state when provided; otherwise use internal state synced via events
  const computedSidebarOpen = typeof sidebarOpen === 'boolean' ? sidebarOpen : internalSidebarOpen;

  return (
    <nav className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border fixed top-0 left-0 right-0 z-50 min-h-[72px]">
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-2.5 md:py-3">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* LEFT SECTION: Menu + Logo + Title */}
          <div className="flex items-center min-w-0 gap-1 sm:gap-2 flex-1 overflow-hidden">
            {/* Menu Button for All Devices */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onMenuClick?.();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('toggle-sidebar'));
                }
              }}
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 flex-shrink-0"
              aria-label={computedSidebarOpen ? "Close menu" : "Open menu"}
            >
              {computedSidebarOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
            
            {/* LOGO - ONLY APPEARS HERE */}
            <Link href={dashboardPath} className="flex items-center flex-shrink-0">
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logo-1762897197877.png?width=8000&height=8000&resize=contain"
                alt="TaskLynk Logo"
                width={150}
                height={48}
                className="h-7 sm:h-8 md:h-9 lg:h-10 xl:h-12 w-auto dark:brightness-110 dark:contrast-125"
                style={{ width: 'auto' }}
                priority
              />
            </Link>
            
            {/* Page Title - Responsive visibility */}
            <div className="hidden md:block px-1 lg:px-2 xl:px-4 min-w-0 flex-1">
              <h1 className="text-xs md:text-sm lg:text-base xl:text-lg font-semibold leading-tight truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* RIGHT SECTION: Role-specific components + Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
            {/* DISPLAY ID - All Roles - Enhanced mobile visibility */}
            {user.displayId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 px-1.5 sm:px-2 md:px-3 py-1 bg-primary/10 rounded-md border border-primary/20 hover:bg-primary/20 transition-colors h-auto">
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground hidden sm:inline">ID:</span>
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold text-primary font-mono">{user.displayId}</span>
                    <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Display ID</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <p className="text-sm text-muted-foreground mb-1">Your unique ID:</p>
                    <p className="text-base font-bold text-primary font-mono">{user.displayId}</p>
                    <p className="text-xs text-muted-foreground mt-2">Use this ID for tracking orders and communication.</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* CLIENT TIER BADGE - Enhanced mobile visibility */}
            {(user.role === 'client' || user.role === 'account_owner') && user.clientTier && user.approved && (
              <Badge 
                variant="default"
                className={`capitalize font-semibold text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 whitespace-nowrap ${
                  user.clientTier === 'premium' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md' :
                  user.clientTier === 'gold' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md' :
                  'bg-gray-600 text-white shadow-md'
                }`}
              >
                <span className="hidden sm:inline">{user.clientTier} Client</span>
                <span className="sm:hidden">{user.clientTier}</span>
              </Badge>
            )}

            {/* CLIENT PRIORITY BADGE - Enhanced mobile visibility */}
            {(user.role === 'client' || user.role === 'account_owner') && user.clientPriority && user.clientPriority !== 'regular' && user.approved && (
              <Badge variant="destructive" className="font-semibold text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 animate-pulse shadow-md whitespace-nowrap">
                <span className="hidden md:inline">⭐ {user.clientPriority.toUpperCase()} PRIORITY</span>
                <span className="md:hidden">⭐ {user.clientPriority.toUpperCase()}</span>
              </Badge>
            )}

            {/* MANAGER BADGE - NEW: Show manager identification */}
            {user.role === 'manager' && user.approved && (
              <Badge 
                variant="default"
                className="capitalize font-semibold text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md whitespace-nowrap"
              >
                <span className="hidden sm:inline">Manager</span>
                <span className="sm:hidden">MGR</span>
              </Badge>
            )}

            {/* ADMIN BADGE - NEW: Show admin identification */}
            {user.role === 'admin' && (
              <Badge 
                variant="default"
                className="capitalize font-semibold text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md whitespace-nowrap"
              >
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">ADM</span>
              </Badge>
            )}

            {/* FREELANCER BALANCE - Enhanced mobile visibility */}
            {user.role === 'freelancer' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border-2 border-green-500/30 hover:border-green-500/50 transition-all group h-auto">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-[7px] sm:text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wide hidden sm:block">Balance</span>
                      <span className="text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-green-600">
                        KSh {(Number(user.balance) || 0).toFixed(0)}
                      </span>
                    </div>
                    <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground ml-0.5 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Financial Overview</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-3 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                      <p className="text-xl font-bold text-green-600">KSh {(Number(user.balance) || 0).toFixed(2)}</p>
                    </div>
                    {user.rating !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Your Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <p className="text-base font-semibold">{Number(user.rating).toFixed(1)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/freelancer/financial-overview" className="cursor-pointer">
                      View Full Financial Overview
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* FREELANCER BADGE - Enhanced mobile visibility */}
            {user.role === 'freelancer' && user.approved && user.freelancerBadge && (
              <Badge 
                variant="default"
                className={`capitalize font-semibold text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 whitespace-nowrap ${
                  user.freelancerBadge === 'platinum' ? 'bg-gradient-to-r from-slate-400 to-gray-500 text-white' :
                  user.freelancerBadge === 'gold' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                  user.freelancerBadge === 'silver' ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                  'bg-gradient-to-r from-orange-600 to-red-500 text-white'
                }`}
              >
                <span className="hidden sm:inline">{user.freelancerBadge} Writer</span>
                <span className="sm:hidden">{user.freelancerBadge}</span>
              </Badge>
            )}

            {/* FREELANCER RATING - Enhanced mobile visibility */}
            {user.role === 'freelancer' && user.rating !== null && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 hover:bg-accent rounded-md transition-colors h-auto">
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] sm:text-xs md:text-sm font-semibold">{Number(user.rating).toFixed(1)}</span>
                    <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Your Rating</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <p className="text-2xl font-bold">{Number(user.rating).toFixed(1)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Based on completed orders and client feedback.</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Notification Bell */}
            <NotificationBell />
            
            {/* Theme Switcher - Hidden on very small screens */}
            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring" aria-label="Open profile menu">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 bg-sidebar-accent/20 text-sidebar-foreground border border-sidebar-border">
                    <AvatarFallback className="text-[10px] sm:text-xs md:text-sm text-sidebar-foreground bg-transparent">{initials}</AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -top-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ring-2 ring-sidebar ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
                    aria-hidden="true"
                    title={isOnline ? 'Online' : 'Offline'}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {user.displayId && (
                      <p className="text-xs font-mono text-primary font-semibold">
                        {user.displayId}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role}
                    </p>
                    {user.role === 'freelancer' && (
                      <div className="pt-2 mt-2 border-t">
                        <p className="text-xs text-muted-foreground">Current Balance</p>
                        <p className="text-sm font-bold text-green-600">KSh {(Number(user.balance) || 0).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={settingsPath} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Pending approval banner - Enhanced mobile visibility */}
      {(!user.approved && user.role !== 'admin') && (
        <div className="bg-amber-100 dark:bg-amber-900/40 border-t border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100">
          <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm flex items-center justify-between gap-2">
            <span className="truncate">
              <span className="hidden sm:inline">Account pending admin approval. You can browse your dashboard but actions are disabled.</span>
              <span className="sm:hidden">Pending approval - actions disabled</span>
            </span>
            <Link href={settingsPath}>
              <Button size="sm" variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100 text-[10px] sm:text-xs h-6 sm:h-8 px-2 sm:px-3">
                <span className="hidden sm:inline">Profile Settings</span>
                <span className="sm:hidden">Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export function DashboardNav({ onMenuClick, sidebarOpen }: DashboardNavContentProps) {
  return (
    <Suspense fallback={<div className="h-[72px] bg-sidebar border-b border-sidebar-border" />}>
      <DashboardNavContent onMenuClick={onMenuClick} sidebarOpen={sidebarOpen} />
    </Suspense>
  );
}