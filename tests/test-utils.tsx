import * as React from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';

export function renderWithProviders(ui: React.ReactElement, { locale = 'en', queryClient }: { locale?: 'en' | 'ar'; queryClient?: QueryClient } = {}) {
  const client = queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const messages = locale === 'ar' ? ar : en;
  return {
    client,
    ...render(
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Riyadh">
        <QueryClientProvider client={client}>
          <TooltipProvider>{ui}</TooltipProvider>
        </QueryClientProvider>
      </NextIntlClientProvider>,
    ),
  };
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}
