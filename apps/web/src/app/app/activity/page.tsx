'use client';

import Link from 'next/link';
import { Trophy, ArrowRight } from 'lucide-react';
import { ActivityFeed } from '@/components/ActivityFeed';
import { useTranslations } from '@/lib/i18n';

export default function ActivityPage() {
  const t = useTranslations();
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">{t('activity.page.title')}</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground text-balance">
          {t('activity.page.subtitle')}
        </p>
      </header>

      <ActivityFeed />

      <Link
        href="/leaderboard"
        className="group glass spotlight flex items-center justify-between gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-3">
          <Trophy className="size-6 text-accent" />
          <div>
            <p className="font-semibold">{t('activity.page.leaderboard.title')}</p>
            <p className="text-sm text-muted-foreground">{t('activity.page.leaderboard.body')}</p>
          </div>
        </div>
        <ArrowRight className="size-5 -translate-x-1 text-muted-foreground transition-all group-hover:translate-x-0 group-hover:text-foreground" />
      </Link>
    </div>
  );
}
