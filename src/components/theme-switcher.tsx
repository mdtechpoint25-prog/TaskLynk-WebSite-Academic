"use client";

import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Check } from 'lucide-react';

const themes = [
  { value: 'professional', label: 'Professional', description: 'Deep Royal Blue & Gold', color: 'bg-gradient-to-r from-[#1A237E] to-[#FFC107]' },
  { value: 'dark', label: 'Dark', description: 'Dark Navy & Amber', color: 'bg-gradient-to-r from-[#0F172A] to-[#FFD54F]' },
  { value: 'earthy', label: 'Earthy', description: 'Olive & Tan Warmth', color: 'bg-gradient-to-r from-[#3A2D0F] to-[#C3A87F]' },
  { value: 'nature', label: 'Nature', description: 'Forest Green & Rust', color: 'bg-gradient-to-r from-[#283618] to-[#87551D]' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Color Themes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value as any)}
            className="cursor-pointer py-3"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${t.color} border-2 border-border shadow-md`} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{t.label}</span>
                  <span className="text-xs text-muted-foreground">{t.description}</span>
                </div>
              </div>
              {theme === t.value && <Check className="h-4 w-4 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}