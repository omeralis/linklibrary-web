'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { accountApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import type { Locale, Theme, User } from '@/lib/api/types';
import { useErrorMessage } from '@/hooks/use-error-message';

/** Language and theme, saved to the account (PATCH /me) and applied immediately. */
export function PreferencesCard({ user }: { user: User }) {
  const t = useTranslations('settings.preferences');
  const tt = useTranslations('common.theme');
  const locale = useLocale() as Locale;
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();

  async function save(patch: { locale?: Locale; theme?: Theme }) {
    try {
      const res = await accountApi.update(patch);
      queryClient.setQueryData(queryKeys.session, res.data);
      toast.success(t('saved'));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-medium">{t('language')}</legend>
          <RadioGroup
            value={locale}
            onValueChange={async (value) => {
              await save({ locale: value as Locale });
              const qs = searchParams.toString();
              router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: value as Locale });
            }}
            className="flex flex-wrap gap-3"
          >
            {(['ar', 'en'] as const).map((l) => (
              <Label key={l} className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value={l} />
                <span lang={l}>{l === 'ar' ? 'العربية' : 'English'}</span>
              </Label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">{t('languageHint', { saved: user.locale === 'ar' ? 'العربية' : 'English' })}</p>
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-medium">{t('theme')}</legend>
          <RadioGroup
            value={theme ?? user.theme}
            onValueChange={(value) => {
              setTheme(value);
              void save({ theme: value as Theme });
            }}
            className="flex flex-wrap gap-3"
          >
            {(['system', 'light', 'dark'] as const).map((th) => (
              <Label key={th} className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value={th} />
                {tt(th)}
              </Label>
            ))}
          </RadioGroup>
        </fieldset>
      </CardContent>
    </Card>
  );
}
