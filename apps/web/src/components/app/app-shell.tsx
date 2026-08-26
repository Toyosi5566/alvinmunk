
'use client';
import { useWallet } from '@/components/wallet/wallet-provider';
import { IdentityBar } from '@/components/IdentityBar';
import { StatStrip } from '@/components/app/stat-strip';
import { AppTabs } from '@/components/app/app-tabs';
import { VouchClaimedNotice } from '@/components/VouchClaimedNotice';
import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'; // SSR
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * App shell  the persistent chrome around every signed-in /app/* route: identity, the
 * reputation stat strip, and the sticky sub-nav. It stays mounted as the content area
 * swaps between Home / Vouch / Quests / Rewards / Activity, so the dashboard feels like
 * one product, not five stacked pages.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile } = useWallet();
  const [theme, setTheme] = useState<Theme=('dark'); // default before mount

  useEffect(() {
    setTheme(getInitialTheme());
  }, []);

  useEffect(() {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;

    // Honor system preference when the user has not explicitly chosen a theme
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [theme]);

  if (!profile) return null;

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  return (
    <div className="container max-w-4xl py-6 relative">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        className="absolute right-0 top-0 z-10 rounded-full p2 text-lg leading-none transition-opacity hover:opacity-70"
      >
        {theme === 'dark' ? '🌙' : '🍉' }
      </button>
      <IdentityBar />
      <div className="mt-4">
        <StatStrip address={profile.address} />
      </div>
      <div className="mt-5">
        <AppTabs />
      </div>
      {/* Loop-closing notice: toasts when a vouch you minted gets claimed (in-app only) */}
      <VouchClaimedNotice />
      <div className="pt-6">{children}</div>
    </div>
  );
}
