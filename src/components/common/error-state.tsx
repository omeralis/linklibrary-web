'use client';

import { AlertTriangle, RefreshCw, WifiOff, Lock, SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { isApiError } from '@/lib/api/errors';
import { useErrorMessage } from '@/hooks/use-error-message';
import { cn } from '@/lib/utils';

/** Inline error panel for failed queries: localized message + retry. 404 is rendered as "not available". */
export function ErrorState({ error, onRetry, className, compact = false }: { error: unknown; onRetry?: () => void; className?: string; compact?: boolean }) {
  const t = useTranslations('errors');
  const message = useErrorMessage();
  const api = isApiError(error) ? error : null;
  const Icon = api?.isNetwork ? WifiOff : api?.isNotFound ? SearchX : api?.isForbidden ? Lock : AlertTriangle;
  const title = api?.isNotFound ? t('notAvailableTitle') : api?.isNetwork ? t('networkTitle') : t('title');
  const body = api?.isNotFound ? t('notAvailableBody') : message(error);

  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center rounded-xl border bg-card px-6 text-center', compact ? 'py-6' : 'py-12', className)}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {onRetry && !api?.isNotFound && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw aria-hidden />
          {t('retry')}
        </Button>
      )}
    </div>
  );
}
