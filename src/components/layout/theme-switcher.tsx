'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { accountApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import type { Theme } from '@/lib/api/types';
import { useSession } from '@/hooks/use-session';

export function ThemeSwitcher() {
  const t = useTranslations('common.theme');
  const { theme, setTheme } = useTheme();
  const { user } = useSession();
  const queryClient = useQueryClient();

  function change(next: string) {
    setTheme(next);
    if (user && user.theme !== next) {
      accountApi
        .update({ theme: next as Theme })
        .then((res) => queryClient.setQueryData(queryKeys.session, res.data))
        .catch(() => undefined);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('label')}>
          <Sun className="dark:hidden" aria-hidden />
          <Moon className="hidden dark:block" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={change}>
          <DropdownMenuRadioItem value="light">
            <Sun aria-hidden /> {t('light')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon aria-hidden /> {t('dark')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor aria-hidden /> {t('system')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
