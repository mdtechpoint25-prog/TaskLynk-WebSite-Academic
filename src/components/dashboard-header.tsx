"use client";

import { UserProfilePanel } from '@/components/user-profile-panel';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  userId: number;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function DashboardHeader({ userId, onMenuClick, showMenuButton = true }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold hidden sm:block">TaskLynk Dashboard</h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <UserProfilePanel userId={userId} />
        </div>
      </div>
    </header>
  );
}
