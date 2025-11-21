"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  MessageSquare,
  DollarSign,
  Settings,
  PackageCheck,
  CheckCircle2,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  Ban,
  Receipt,
  ChevronDown,
  ChevronRight,
  X,
  ShieldCheck,
  FileText,
  UserCog,
  Globe,
  UserCheck,
  Briefcase,
  ShieldAlert
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  match?: (pathname: string) => boolean;
};

type AdminSidebarContentProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

function AdminSidebarContent({ isOpen, onClose }: AdminSidebarContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const isOrdersPath = pathname.startsWith("/admin/jobs");
  const isUserManagementPath = pathname.startsWith("/admin/user-management");
  const [ordersOpen, setOrdersOpen] = useState<boolean>(isOrdersPath);
  const [userManagementOpen, setUserManagementOpen] = useState<boolean>(isUserManagementPath);

  // Close on route change (mobile only)
  useEffect(() => {
    if (onClose && typeof window !== "undefined" && window.innerWidth < 768) {
      onClose();
    }
  }, [pathname, onClose]);

  if (!user || user.role !== "admin") return null;

  const topItems: NavItem[] = [
    { href: "/admin/managers", label: "Managers", icon: ShieldCheck },
    { href: "/admin/domains", label: "Domains", icon: Globe },
    { href: "/admin/messages", label: "Messages", icon: MessageSquare, match: (p) => p.startsWith("/admin/messages") },
    { href: "/admin/payments", label: "Payments", icon: DollarSign },
    { href: "/admin/payouts", label: "Payouts", icon: Receipt },
    { href: "/admin/emails", label: "Emails", icon: FileText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const currentStatus = searchParams?.get("status") || "";

  return (
    <>
      {/* Mobile Overlay - Only show on mobile when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden top-[72px]" 
          onClick={onClose}
        />
      )}

      {/* Sidebar - Always visible on desktop (md+), collapsible on mobile */}
      <aside
        className={`
          fixed top-[72px] left-0 z-50 
          w-64 h-[calc(100vh-72px)]
          flex flex-col overflow-hidden
          border-r border-sidebar-border bg-sidebar text-sidebar-foreground
          shadow-lg transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end p-2 border-b border-sidebar-border flex-shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-8 w-8 rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-sidebar-border flex-shrink-0 bg-gradient-to-b from-sidebar/50 to-sidebar">
          <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wider font-semibold">Admin</p>
          <div className="mt-2">
            <p className="text-sm font-bold line-clamp-1 text-sidebar-foreground">{user.name}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="px-3 space-y-1">
            {/* Overview */}
            <li>
              <Link
                href="/admin/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${pathname === "/admin/dashboard" ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm font-medium">Overview</span>
              </Link>
            </li>

            {/* Orders Group */}
            <li>
              <button
                type="button"
                onClick={() => setOrdersOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-colors ${isOrdersPath ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}
                aria-expanded={ordersOpen}
              >
                <span className="flex items-center gap-3">
                  <ClipboardList className="h-4 w-4" />
                  <span className="text-sm font-medium">Orders</span>
                </span>
                {ordersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {ordersOpen && (
                <ul className="mt-1 ml-8 space-y-1">
                  <li>
                    <Link href="/admin/jobs?status=all" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && (currentStatus === 'all' || !currentStatus) ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <ClipboardList className="h-3.5 w-3.5" /> All
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=pending" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'pending' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <PauseCircle className="h-3.5 w-3.5" /> Pending
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=approved" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'approved' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=assigned" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'assigned' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <Users className="h-3.5 w-3.5" /> Assigned
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=in_progress" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'in_progress' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <PlayCircle className="h-3.5 w-3.5" /> In Progress
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=editing" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'editing' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <FileText className="h-3.5 w-3.5" /> Editing
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=delivered" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'delivered' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <PackageCheck className="h-3.5 w-3.5" /> Delivered
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=revision" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'revision' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <RotateCcw className="h-3.5 w-3.5" /> Revision
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=accepted" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'accepted' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=paid" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'paid' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <Receipt className="h-3.5 w-3.5" /> Paid
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=completed" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'completed' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=on_hold" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'on_hold' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <PauseCircle className="h-3.5 w-3.5" /> On Hold
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/jobs?status=cancelled" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname.startsWith("/admin/jobs") && currentStatus === 'cancelled' ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <Ban className="h-3.5 w-3.5" /> Cancelled
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* User Management Group */}
            <li>
              <button
                type="button"
                onClick={() => setUserManagementOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-colors ${isUserManagementPath ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}
                aria-expanded={userManagementOpen}
              >
                <span className="flex items-center gap-3">
                  <UserCog className="h-4 w-4" />
                  <span className="text-sm font-medium">User Management</span>
                </span>
                {userManagementOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {userManagementOpen && (
                <ul className="mt-1 ml-8 space-y-1">
                  <li>
                    <Link href="/admin/user-management" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname === "/admin/user-management" ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <Users className="h-3.5 w-3.5" /> All Users
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/user-management/freelancers" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname === "/admin/user-management/freelancers" ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <UserCheck className="h-3.5 w-3.5" /> Freelancers
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/user-management/clients" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname === "/admin/user-management/clients" ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <Briefcase className="h-3.5 w-3.5" /> Clients
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/user-management/managers" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname === "/admin/user-management/managers" ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <ShieldCheck className="h-3.5 w-3.5" /> Managers
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/user-management/admins" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${pathname === "/admin/user-management/admins" ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}>
                      <ShieldAlert className="h-3.5 w-3.5" /> Admins
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Other Navigation Items */}
            {topItems.map(({ href, label, icon: Icon, match }) => {
              const isActive = match ? match(pathname) : pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t text-xs text-muted-foreground flex-shrink-0">© {new Date().getFullYear()} TaskLynk</div>
      </aside>
    </>
  );
}

export const AdminSidebar = ({ isOpen, onClose }: AdminSidebarContentProps) => {
  return (
    <Suspense
      fallback={
        <aside className="hidden md:block fixed top-[72px] left-0 w-64 h-[calc(100vh-72px)] flex-shrink-0 border-r bg-sidebar text-sidebar-foreground">
          <div className="px-4 py-4 border-b">
            <div className="h-4 w-24 bg-muted animate-pulse rounded-xl"></div>
            <div className="mt-2 h-5 w-32 bg-muted animate-pulse rounded-xl"></div>
          </div>
        </aside>
      }
    >
      <AdminSidebarContent isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
};