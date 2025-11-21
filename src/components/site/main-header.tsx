"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { usePathname } from "next/navigation";

export const MainHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar - Contact Info - 70% transparent when scrolled */}
      <div
        className={`border-b transition-all duration-300 py-2.5 ${
          scrolled
            ? "bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-border shadow-sm"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-4 text-foreground/80">
              <span className="flex items-center gap-2">
                <span className="font-medium">CALL:</span> <span>+254 701 066 845</span>
              </span>
              <span className="hidden md:inline-flex text-muted-foreground">
                Professional Academic Writing Services
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                Home
              </Link>
              <Link href="/login" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                Sign In
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/register" className="text-foreground/80 hover:text-primary transition-colors font-medium">
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar - 70% transparent when scrolled */}
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? "bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logo-1762897197877.png?width=8000&height=8000&resize=contain"
                alt="TaskLynk Logo"
                width={180}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>

            <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
              <Link href="/" className="text-foreground/80 hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-foreground/80 hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/services" className="text-foreground/80 hover:text-primary transition-colors">
                Services
              </Link>
              <Link href="/contact" className="text-foreground/80 hover:text-primary transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <Button asChild size="sm" className="btn btn-primary text-sm font-semibold">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default MainHeader;