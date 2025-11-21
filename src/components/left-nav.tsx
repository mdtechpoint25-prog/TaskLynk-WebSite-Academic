"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  ShoppingBag, 
  FileText, 
  MessageSquare, 
  CreditCard, 
  Users,
  DollarSign,
  ChevronDown,
  Receipt,
  FileEdit,
  Mail,
  TrendingUp,
  Database,
  UserCog,
  Building,
  Briefcase,
  Shield,
  UserCheck,
  UsersRound,
  Settings,
  PauseCircle,
  CheckCircle,
  Edit3,
  XCircle,
  Clock,
  Wallet,
  FileSearch
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  submenu?: NavItem[];
};

type LeftNavProps = {
  role: 'freelancer' | 'admin' | 'client' | 'manager';
  userName: string;
  userRole: string;
  items?: NavItem[];
};

const defaultFreelancerItems: NavItem[] = [
  { title: 'Overview', href: '/freelancer/dashboard', icon: Home },
  { title: 'Available Orders', href: '/freelancer/orders', icon: ShoppingBag },
  { title: 'Active Orders', href: '/freelancer/jobs', icon: FileText },
  { title: 'Financial Overview', href: '/freelancer/financial-overview', icon: DollarSign },
  { title: 'Messages', href: '/freelancer/messages', icon: MessageSquare },
];

const defaultAdminItems: NavItem[] = [
  { title: 'Overview', href: '/admin/dashboard', icon: Home },
  { title: 'Progress Summary', href: '/admin/progress', icon: TrendingUp },
  { 
    title: 'Orders', 
    href: '/admin/jobs', 
    icon: ShoppingBag,
    submenu: [
      { title: 'All Orders', href: '/admin/jobs', icon: FileText },
      { title: 'Pending Approval', href: '/admin/jobs?status=pending', icon: Clock },
      { title: 'Ready for Assignment', href: '/admin/jobs/approved', icon: CheckCircle },
      { title: 'Assigned to Writer', href: '/admin/jobs?status=assigned', icon: UserCheck },
      { title: 'In Progress', href: '/admin/jobs?status=in_progress', icon: Edit3 },
      { title: 'Editing', href: '/admin/jobs?status=editing', icon: FileEdit },
      { title: 'On Hold', href: '/admin/jobs?status=on_hold', icon: PauseCircle },
      { title: 'Delivered to Client', href: '/admin/jobs?status=delivered', icon: CheckCircle },
      { title: 'Client Approved', href: '/admin/jobs/accepted', icon: CheckCircle },
      { title: 'Revisions', href: '/admin/revisions', icon: FileEdit },
      { title: 'Paid', href: '/admin/jobs/paid', icon: Receipt },
      { title: 'Completed', href: '/admin/jobs?status=completed', icon: CheckCircle },
      { title: 'Cancelled', href: '/admin/jobs?status=cancelled', icon: XCircle },
    ]
  },
  { 
    title: 'Users', 
    href: '/admin/users', 
    icon: Users,
    submenu: [
      { title: 'All Users', href: '/admin/users', icon: Users },
      { title: 'Managers', href: '/admin/users/managers', icon: UsersRound },
      { title: 'Account Owners', href: '/admin/users?role=account_owners', icon: Building },
      { title: 'Regular Clients', href: '/admin/users?role=regular_clients', icon: UserCog },
      { title: 'Freelancers', href: '/admin/users?role=freelancers', icon: Briefcase },
      { title: 'Admins', href: '/admin/users?role=admins', icon: Shield },
    ]
  },
  { title: 'Revisions', href: '/admin/revisions', icon: FileEdit },
  { title: 'Payments', href: '/admin/payments', icon: CreditCard },
  { title: 'Payouts', href: '/admin/payouts', icon: Wallet },
  { title: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { title: 'Email Management', href: '/admin/emails', icon: Mail },
  { title: 'Audit Logs', href: '/admin/audit-logs', icon: FileSearch },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
  { title: 'Storage Setup', href: '/admin/storage-setup', icon: Database },
];

const defaultManagerItems: NavItem[] = [
  { title: 'Overview', href: '/manager/dashboard', icon: Home },
  { title: 'Jobs', href: '/manager/jobs', icon: ShoppingBag },
  { 
    title: 'Orders', 
    href: '/manager/orders/all', 
    icon: FileText,
    submenu: [
      { title: 'All Orders', href: '/manager/orders/all', icon: FileText },
      { title: 'Pending', href: '/manager/orders/pending', icon: Clock },
      { title: 'Accepted Orders', href: '/manager/orders/accepted', icon: CheckCircle },
      { title: 'In Progress', href: '/manager/orders/in-progress', icon: Edit3 },
      { title: 'Assigned', href: '/manager/orders/assigned', icon: UserCheck },
      { title: 'Editing', href: '/manager/orders/editing', icon: FileEdit },
      { title: 'On Hold', href: '/manager/orders/on-hold', icon: PauseCircle },
      { title: 'Delivered', href: '/manager/orders/delivered', icon: CheckCircle },
      { title: 'Client Approved', href: '/manager/orders/approved', icon: CheckCircle },
      { title: 'Revisions', href: '/manager/orders/revision', icon: FileEdit },
      { title: 'Paid', href: '/manager/orders/paid', icon: Receipt },
      { title: 'Completed', href: '/manager/orders/completed', icon: CheckCircle },
      { title: 'Cancelled', href: '/manager/orders/cancelled', icon: XCircle },
    ]
  },
  { 
    title: 'Clients', 
    href: '/manager/clients', 
    icon: UserCheck,
    submenu: [
      { title: 'All Clients', href: '/manager/clients/all', icon: UserCheck },
      { title: 'Account Owners', href: '/manager/clients/account-owners', icon: Building },
      { title: 'Regular Clients', href: '/manager/clients/regular', icon: UserCog },
      { title: 'On Hold Clients', href: '/manager/clients/on-hold', icon: PauseCircle },
    ]
  },
  { 
    title: 'Freelancers', 
    href: '/manager/writers', 
    icon: Briefcase,
    submenu: [
      { title: 'All Freelancers', href: '/manager/writers/all', icon: Briefcase },
      { title: 'On Hold Freelancers', href: '/manager/writers/on-hold', icon: PauseCircle },
    ]
  },
  { title: 'User Management', href: '/manager/user-management', icon: Users },
  { title: 'Revisions', href: '/manager/revisions', icon: FileEdit },
  { title: 'Payments', href: '/manager/payments', icon: CreditCard },
  { title: 'Messages', href: '/manager/messages', icon: MessageSquare },
  { title: 'Performance', href: '/manager/performance', icon: TrendingUp },
  { title: 'Settings', href: '/manager/settings', icon: Settings },
];

const defaultClientItems: NavItem[] = [
  { title: 'Overview', href: '/client/dashboard', icon: Home },
  { title: 'My Orders', href: '/client/jobs', icon: FileText },
  { title: 'New Job', href: '/client/new-job', icon: ShoppingBag },
  { title: 'Messages', href: '/client/messages', icon: MessageSquare },
  { title: 'Settings', href: '/client/settings', icon: Settings },
];

export function LeftNav({ role, userName, userRole, items }: LeftNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  // Global open/close support for mobile via DashboardNav toggle events
  const [open, setOpen] = useState<boolean>(true);
  useEffect(() => {
    const toggleHandler = () => setOpen((v) => !v);
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    if (typeof window !== 'undefined') {
      window.addEventListener('toggle-sidebar', toggleHandler as EventListener);
      window.addEventListener('open-sidebar', openHandler as EventListener);
      window.addEventListener('close-sidebar', closeHandler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('toggle-sidebar', toggleHandler as EventListener);
        window.removeEventListener('open-sidebar', openHandler as EventListener);
        window.removeEventListener('close-sidebar', closeHandler as EventListener);
      }
    };
  }, []);
  
  const baseItems = items || 
    (role === 'freelancer' ? defaultFreelancerItems : 
     role === 'admin' ? defaultAdminItems : 
     role === 'manager' ? defaultManagerItems :
     defaultClientItems);

  // Approval-aware filtering
  const navItems = useMemo(() => {
    if (!user || user.approved || role === 'admin') return baseItems;

    if (role === 'freelancer') {
      return baseItems.filter(i => ['/freelancer/dashboard','/freelancer/settings'].includes(i.href));
    }
    if (role === 'manager') {
      return baseItems.filter(i => ['/manager/dashboard','/manager/settings'].includes(i.href));
    }
    if (role === 'client') {
      return baseItems.filter(i => ['/client/dashboard','/client/settings'].includes(i.href));
    }
    return baseItems;
  }, [baseItems, role, user]);

  // Auto-expand submenu if current path matches
  useEffect(() => {
    navItems.forEach(item => {
      if (item.submenu) {
        const hasActiveSubmenu = item.submenu.some(subItem => 
          pathname.startsWith(subItem.href.split('?')[0]) || pathname === subItem.href.split('?')[0]
        );
        if (hasActiveSubmenu && !expandedItems.includes(item.title)) {
          setExpandedItems(prev => [...prev, item.title]);
        }
      }
    });
  }, [pathname, navItems]);

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems(prev => 
      prev.includes(itemTitle) 
        ? prev.filter(t => t !== itemTitle)
        : [...prev, itemTitle]
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden top-[72px]"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-[72px] left-0 z-40 h-[calc(100vh-72px)] w-64 border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } flex flex-col overflow-hidden`}
      >
        {/* Navigation - scrollable content */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedItems.includes(item.title);
              
              return (
                <li key={item.href}>
                  {hasSubmenu ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(item.title)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-sm text-left">{item.title}</span>
                            <ChevronDown className={cn(
                              "w-4 h-4 transition-transform",
                              isExpanded && "rotate-180"
                            )} />
                          </>
                        )}
                      </button>
                      
                      {/* Submenu - FIXED: Use theme variables instead of hardcoded colors */}
                      {!collapsed && isExpanded && (
                        <ul className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border/50 pl-2">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const [subPath, subQuery] = subItem.href.split('?');
                            const matchesPath = pathname === subPath || pathname.startsWith(subPath + '/');
                            const matchesQuery = !subQuery
                              ? true
                              : subQuery.split('&').every(pair => {
                                  const [k, v] = pair.split('=');
                                  return (searchParams?.get(k) || '') === decodeURIComponent(v || '');
                                });
                            const isSubActive = matchesPath && matchesQuery;
                            
                            return (
                              <li key={subItem.href}>
                                <Link
                                  href={subItem.href}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                                    isSubActive
                                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                  )}
                                >
                                  <SubIcon className="w-4 h-4 flex-shrink-0" />
                                  <span>{subItem.title}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-sm">{item.title}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={cn(
                              "px-2 py-0.5 text-xs rounded-full font-medium",
                              isActive 
                                ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                                : "bg-sidebar-primary/10 text-sidebar-primary"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4 flex-shrink-0">
          <p className="text-xs text-sidebar-foreground/70">© {new Date().getFullYear()} TaskLynk</p>
        </div>
      </aside>
    </>
  );
}