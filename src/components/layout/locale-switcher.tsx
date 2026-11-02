'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { accountApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { useSession } from '@/hooks/use-session';

const LABELS: Record<Locale, string> = { ar: 'العربية', en: 'English' };

/**
 * Switches /ar ↔ /en for the current page (keeps the query string). The choice is persisted in the
 * NEXT_LOCALE cookie by next-intl and, when signed in, saved to the account (PATCH /me) so e-mails and
 * API messages use it too.
 */
export function LocaleSwitcher({ variant = 'icon' }: { variant?: 'icon' | 'full' }) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const queryClient = useQueryClient();

  function change(next: string) {
    if (next === locale) return;
    const qs = searchParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: next as Locale, scroll: false });
    if (user && user.locale !== next) {
      accountApi
        .update({ locale: next as Locale })
        .then((res) => queryClient.setQueryData(queryKeys.session, res.data))
        .catch(() => undefined); // Non-blocking: the URL/cookie already reflect the choice.
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" aria-label={t('language')}>
            <Languages aria-hidden />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Languages aria-hidden />
            {LABELS[locale]}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={locale} onValueChange={change}>
          {routing.locales.map((l) => (
            <DropdownMenuRadioItem key={l} value={l} lang={l}>
              {LABELS[l]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LocaleSwitcherFallback() {
  return <span className="inline-block size-9" aria-hidden />;
}
