'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/components/wallet/wallet-provider';
import { FOCUS_MODE } from '@/lib/focus';
import { Quests } from '@/components/Quests';
import { useTranslations } from '@/lib/i18n';

export default function QuestsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { profile } = useWallet();
  useEffect(() => {
    if (FOCUS_MODE) router.replace('/app');
  }, [router]);
  if (FOCUS_MODE || !profile) return null;

  // The subtitle contains an inline coloured span for "Earned XP". We split on the
  // interpolated placeholder text so both locales keep the highlight in the right place.
  const earnedXP = t('quests.page.earnedXP');
  const subtitleRaw = t('quests.page.subtitle', { earnedXP });
  const [before, after] = subtitleRaw.split(earnedXP);

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">{t('quests.page.title')}</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground text-balance">
          {before}
          <span className="text-secondary">{earnedXP}</span>
          {after}
        </p>
      </header>

      <Quests address={profile.address} />
    </div>
  );
}
