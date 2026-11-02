'use client';

import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Direction } from 'radix-ui';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { createQueryClient } from '@/lib/query-client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { PreferenceSync } from './preference-sync';

export function AppProviders({ children, dir }: { children: React.ReactNode; dir: 'rtl' | 'ltr' }) {
  const t = useTranslations('auth');
  const [queryClient] = React.useState(() =>
    createQueryClient({
      onSessionLost: (reason) => {
        if (reason === 'suspended') toast.error(t('suspended'));
        else toast.warning(t('sessionExpired'));
      },
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <Direction.Provider dir={dir}>
          <TooltipProvider>
            {children}
            <PreferenceSync />
            <Toaster position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'} dir={dir} />
          </TooltipProvider>
        </Direction.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
