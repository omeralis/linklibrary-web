'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

/** Route-level error boundary. Never renders error details (stack, payload) to the user. */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors');
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') console.error(error);
  }, [error]);
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold">{t('boundaryTitle')}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t('boundaryBody')}</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">ref: {error.digest}</p>}
      <Button className="mt-6" onClick={reset}>
        <RefreshCw aria-hidden /> {t('retry')}
      </Button>
    </div>
  );
}
