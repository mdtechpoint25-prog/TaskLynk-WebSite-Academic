"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { ManagerSidebar } from "@/components/manager-sidebar";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex w-full">
        <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 pt-[72px] ml-0 md:ml-64 bg-background transition-all duration-300 overflow-x-hidden">
          <div className="px-4 md:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}