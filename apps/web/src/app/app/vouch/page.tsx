'use client';

import { VouchCompose } from '@/components/VouchCompose';
import { PendingHalfCards } from '@/components/PendingHalfCards';
import { useTranslations } from '@/lib/i18n';

export default function VouchPage() {
  const t = useTranslations();
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">{t('vouch.page.title')}</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground text-balance">
          {t('vouch.page.subtitle')}
        </p>
      </header>

      <VouchCompose />
      <PendingHalfCards />
    </div>
  );
}
