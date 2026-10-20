'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, ChevronLeft, Youtube, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseMarkdown } from '@/lib/markdown';

import { slugMap, docsNav, normalizeSlug } from '@/lib/docs-config';

interface DocsViewerProps {
  initialSlug: string;
  allDocs: Record<string, string>;
  docsNav: typeof docsNav;
  slugMap: typeof slugMap;
}

export function DocsViewer({ initialSlug, allDocs, docsNav: navItems, slugMap: mapping }: DocsViewerProps) {
  const [activeSlug, setActiveSlug] = useState(() => normalizeSlug(initialSlug));

  // Sync if initialSlug changes from external router navigation
  useEffect(() => {
    setActiveSlug(normalizeSlug(initialSlug));
  }, [initialSlug]);

  // Support browser Back / Forward navigation via popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const rawSlug = path.replace(/^\/docs\/?/, '').replace(/\/$/, '');
      const canonical = normalizeSlug(rawSlug);
      setActiveSlug(canonical);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((targetSlug: string, e?: React.MouseEvent) => {
    // Permit user modifier keys (Ctrl+click, Cmd+click, middle click) to open in new tab
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) {
      return;
    }
    if (e) {
      e.preventDefault();
    }

    const canonical = normalizeSlug(targetSlug);
    if (canonical === activeSlug) return;

    setActiveSlug(canonical);

    // Update browser URL immediately without server round-trip
    const targetUrl = canonical ? `/docs/${canonical}` : '/docs';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ slug: canonical }, '', targetUrl);
    }

    // Scroll article viewport smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSlug]);

  // Intercept clicks on links inside the documentation markdown that target `/docs/*`
  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('a');
    if (!target) return;
    const href = target.getAttribute('href');
    if (href && href.startsWith('/docs') && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      const rawSlug = href.replace(/^\/docs\/?/, '').replace(/\/$/, '');
      const canonical = normalizeSlug(rawSlug);
      if (canonical in mapping || canonical === '') {
        e.preventDefault();
        handleNavigate(canonical);
      }
    }
  }, [handleNavigate, mapping]);

  // Retrieve active markdown and parse with memoization
  const rawMarkdown = allDocs[activeSlug] || allDocs[''] || '';
  const parsedContent = useMemo(() => parseMarkdown(rawMarkdown), [rawMarkdown]);

  // Calculate previous and next navigation items
  const currentIndex = navItems.findIndex((item) => item.slug === activeSlug);
  const prevItem = currentIndex > 0 ? navItems[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < navItems.length - 1 ? navItems[currentIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        {/* Left Sidebar Navigation - persistent and never unmounted */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28 space-y-6 bg-card/20 border border-card-border/40 rounded-2xl p-5 glass-card backdrop-blur-md">
          <div className="flex items-center gap-2 text-foreground font-extrabold text-sm tracking-wide uppercase select-none border-b border-border-thin pb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Documentation</span>
          </div>
          <nav className="flex flex-col gap-1.5" aria-label="Documentation Navigation">
            {navItems.map((item) => {
              const active = item.slug === activeSlug;
              const href = item.slug ? `/docs/${item.slug}` : '/docs';
              return (
                <Link
                  key={item.slug}
                  href={href}
                  onClick={(e) => handleNavigate(item.slug, e)}
                  className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors duration-150 ${
                    active
                      ? 'bg-primary/20 text-primary border-l-2 border-primary font-bold'
                      : 'text-muted hover:text-foreground hover:bg-white/[0.03]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Official Media & Video Resources */}
          <div className="pt-4 border-t border-border-thin/60 space-y-2">
            <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-muted block px-1">
              Video & Resources
            </span>
            <a
              href="https://youtube.com/@syndaopro"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-xl text-muted hover:text-foreground hover:bg-white/[0.04] transition-colors group"
            >
              <span className="flex items-center gap-2">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>YouTube Guides</span>
              </span>
              <ExternalLink className="w-3 h-3 text-muted/60 group-hover:text-foreground transition-colors" />
            </a>
          </div>
        </aside>

        {/* Main Content Area */}
        <article className="flex-1 w-full max-w-3xl min-h-[50vh] bg-card/10 border border-card-border/30 rounded-2xl p-6 sm:p-10 glass-card backdrop-blur-md relative overflow-hidden">
          {/* Ambient Glow Orbs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-arc-blue/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Fast Animated Content Switcher */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSlug}
              initial={{ opacity: 0.8, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08, ease: 'easeOut' }}
              className="relative z-10 prose dark:prose-invert max-w-none"
              onClick={handleContentClick}
            >
              {parsedContent}
            </motion.div>
          </AnimatePresence>

          {/* Prev/Next Page Navigation */}
          <div className="flex justify-between items-center border-t border-border-thin mt-12 pt-6 gap-4">
            {prevItem ? (
              <Link
                href={prevItem.slug ? `/docs/${prevItem.slug}` : '/docs'}
                onClick={(e) => handleNavigate(prevItem.slug, e)}
                className="flex items-center gap-2 group px-4 py-2.5 rounded-xl border border-card-border hover:border-primary/40 hover:bg-white/[0.02] text-xs font-bold text-muted hover:text-foreground transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <div className="text-left">
                  <div className="text-[9px] uppercase tracking-wider text-text-tertiary">Previous</div>
                  <div>{prevItem.label}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextItem ? (
              <Link
                href={nextItem.slug ? `/docs/${nextItem.slug}` : '/docs'}
                onClick={(e) => handleNavigate(nextItem.slug, e)}
                className="flex items-center gap-2 group px-4 py-2.5 rounded-xl border border-card-border hover:border-primary/40 hover:bg-white/[0.02] text-xs font-bold text-muted hover:text-foreground transition-all duration-200"
              >
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-text-tertiary">Next</div>
                  <div>{nextItem.label}</div>
                </div>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </article>

      </div>
    </div>
  );
}
