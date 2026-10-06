"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * NavigationProgress Component
 * 
 * Provides an instant 0ms top glowing progress bar whenever the user
 * clicks an internal route link, eliminating perceived lag or hesitation
 * between click and route transition.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [, startTransition] = useTransition();

  // Reset navigation indicator whenever the route actually changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Global capture listener for link clicks
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, mailto, tel, anchor hashes, new-tab clicks
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        target.getAttribute("target") === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        e.defaultPrevented
      ) {
        return;
      }

      // Check if it's the exact same page
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl || href === window.location.pathname) {
        return;
      }

      // Start instant 0ms visual feedback
      startTransition(() => {
        setIsNavigating(true);
      });
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="h-[2px] w-full bg-gradient-to-r from-[#2F6FFF] via-[#4F8BFF] to-[#22D3EE] shadow-[0_0_8px_rgba(47,111,255,0.8)] animate-pulse" />
    </div>
  );
}
