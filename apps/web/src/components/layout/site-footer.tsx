'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Footer } from '@/components/layout/footer';

/**
 * Gate the marketing footer to non-app surfaces. The signed-in /app/* dashboard has its own
 * chrome (shell + sub-nav); the editorial footer belongs on marketing + public pages only.
 *
 * Also provides a light/dark theme toggle that persists to localStorage and respects
 * the user's system preference on first visit.
 */
export function SiteFooter() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
 
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      const prefersLight = window.matchMedia('prefers-color-scheme: light').matches;
      setTheme(prefersLight ? 'light' : 'dark');
    }
  }, []);
 
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
 
  if (pathname.startsWith('/app')) return null;
 
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };
 
  return (
    <>
      <Footer />
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 1000,
          borderRadius: '9999px',
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--border, #444)',
          background: 'var(--background, #111)',
          color: 'var(--foreground, #eee)',
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
        }}
      
      >
        {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
      </button>
    </>
  );
 
}
