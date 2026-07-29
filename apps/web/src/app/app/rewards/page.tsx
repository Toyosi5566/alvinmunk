'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/components/wallet/wallet-provider';
import { FOCUS_MODE } from '@/lib/focus';
import { Tip } from '@/components/Tip';
import { Rewards } from '@/components/Rewards';
import { Unlockables } from '@/components/Unlockables';
import { useTranslations } from '@/lib/i18n';

export default function RewardsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { profile } = useWallet();
  useEffect(() => {
    if (FOCUS_MODE) router.replace('/app');
  }, [router]);
  if (FOCUS_MODE || !profile) return null;

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="font-display text-2xl font-semibold">{t('rewards.page.title')}</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground text-balance">
          {t('rewards.page.subtitle')}
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('rewards.page.send')}</h2>
        <Tip address={profile.address} />
      </section>

      <section className="grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('rewards.page.claim')}</h2>
        <Rewards address={profile.address} />
      </section>

      <section className="grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('rewards.page.unlock')}</h2>
        <Unlockables address={profile.address} />
      </section>
    </div>
  );
}
