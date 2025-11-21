"use client";
import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Shows a subtle top progress bar whenever the route changes.
 * No external deps; works in iframe; hides automatically after a short delay.
 */
export const PageTransitionLoader: React.FC<{ minDurationMs?: number }> = ({ minDurationMs = 300 }) => {
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);
  const lastPathRef = React.useRef(pathname);
  const hideTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      // start loader
      setVisible(true);
      // ensure it stays at least minDurationMs to avoid flicker
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setVisible(false), minDurationMs);
    }
    return () => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [pathname, minDurationMs]);

  if (!visible) return null;

  return (
    <div aria-live="polite" aria-atomic="true">
      <div className="fixed left-0 right-0 top-0 z-[60] h-1 overflow-hidden">
        <div className="h-full w-full bg-secondary animate-page-loader" />
      </div>
    </div>
  );
};