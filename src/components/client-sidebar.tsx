"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  MessageSquare, 
  Settings, 
  CheckCircle, 
  Clock, 
  PackageCheck, 
  RotateCcw, 
  XCircle,
  ChevronDown,
  ChevronRight,
  X,
  Wallet,
  PauseCircle,
  BadgeCheck,
  Receipt
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ComponentType } from "react";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
};

type ClientSidebarContentProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

function ClientSidebarContent({ isOpen, onClose }: ClientSidebarContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Determine orders path and initialize state
  const isOrdersPath = pathname.startsWith("/client/jobs") || 
                       pathname.startsWith("/client/pending") || 
                       pathname.startsWith("/client/in-progress") ||
                       pathname.startsWith("/client/delivered") ||
                       pathname.startsWith("/client/accepted") ||
                       pathname.startsWith("/client/paid") ||
                       pathname.startsWith("/client/completed") ||
                       pathname.startsWith("/client/cancelled") ||
                       pathname.startsWith("/client/on-hold") ||
                       pathname.startsWith("/client/revisions");
  const [ordersOpen, setOrdersOpen] = useState<boolean>(isOrdersPath);

  // Close on route change (mobile only)
  useEffect(() => {
    if (onClose && typeof window !== "undefined" && window.innerWidth < 768) {
      onClose();
    }
  }, [pathname, onClose]);

  // Show for both regular clients and account owners
  if (!user || (user.role !== "client" && user.role !== "account_owner")) return null;

  const topItems: NavItem[] = [
    { href: "/client/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/client/new-job", label: "New Job", icon: Plus },
    { href: "/client/financial-overview", label: "Financial Overview", icon: Wallet },
    { href: "/client/messages", label: "Messages", icon: MessageSquare, match: (p) => p.startsWith("/client/messages") },
    { href: "/client/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={onClose}
          style={{ top: '72px' }}
        />
      )}

      {/* Sidebar - Fixed positioning with proper responsive behavior */}
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
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-sidebar-border flex-shrink-0 bg-gradient-to-b from-sidebar/50 to-sidebar">
          <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wider font-semibold">Client</p>
          <div className="mt-2">
            <p className="text-sm font-bold line-clamp-1 text-sidebar-foreground">{user.name}</p>
          </div>
          {user.accountName && (
            <p className="text-xs mt-1 text-sidebar-foreground/70 line-clamp-1">{user.accountName}</p>
          )}
          {typeof user.balance === "number" && (
            <p className="text-xs mt-2 flex items-center justify-between">
              <span className="text-sidebar-foreground/70">Balance:</span>
              <span className="font-bold text-green-500 dark:text-green-400">KSh {user.balance.toFixed(2)}</span>
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="px-3 space-y-1">
            {/* Overview */}
            <li>
              <Link
                href="/client/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-md border transition-colors ${
                  pathname === "/client/dashboard"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm font-medium">Overview</span>
              </Link>
            </li>

            {/* Orders group */}
            <li>
              <button
                type="button"
                onClick={() => setOrdersOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md border transition-colors ${
                  isOrdersPath
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                }`}
                aria-expanded={ordersOpen}
              >
                <span className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Orders</span>
                </span>
                {ordersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {ordersOpen && (
                <ul className="mt-1 ml-8 space-y-1">
                  <li>
                    <Link
                      href="/client/jobs"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                        pathname === "/client/jobs"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" /> All Orders
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/pending"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                        pathname.startsWith("/client/pending")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" /> Pending
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/in-progress"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                        pathname.startsWith("/client/in-progress")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" /> In Progress
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/on-hold"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                        pathname.startsWith("/client/on-hold")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                      }`}
                    >
                      <PauseCircle className="h-3.5 w-3.5" /> On Hold
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/delivered"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                        pathname.startsWith("/client/delivered")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                      }`}
                    >
                      <PackageCheck className="h-3.5 w-3.5" /> Delivered
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/accepted"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                        pathname.startsWith("/client/accepted")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                      }`}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" /> Accepted
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/revisions"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                        pathname.startsWith("/client/revisions")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                      }`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Revisions
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/paid"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                        pathname.startsWith("/client/paid")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                      }`}
                    >
                      <Receipt className="h-3.5 w-3.5" /> Paid
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/completed"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                        pathname.startsWith("/client/completed")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                      }`}
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Completed
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/cancelled"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                        pathname.startsWith("/client/cancelled")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                      }`}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancelled
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Remaining top-level items */}
            {topItems.map(({ href, label, icon: Icon, match }) => {
              const isActive = match ? match(pathname) : pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md border transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
                    }`}
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

export const ClientSidebar = ({ isOpen, onClose }: ClientSidebarContentProps) => {
  return (
    <Suspense
      fallback={
        <aside className="hidden md:block fixed top-[72px] left-0 w-64 h-[calc(100vh-72px)] flex-shrink-0 border-r bg-sidebar text-sidebar-foreground">
          <div className="px-4 py-4 border-b">
            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
            <div className="mt-2 h-5 w-32 bg-muted animate-pulse rounded"></div>
          </div>
        </aside>
      }
    >
      <ClientSidebarContent isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
};