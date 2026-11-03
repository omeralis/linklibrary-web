'use client';

import { AlertTriangle, Ban, Loader2, RefreshCw, ShieldQuestion } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { OwnedLink, Processing } from '@/lib/api/types';
import { useProcessingPoll, useReanalyze } from '@/hooks/use-links';
import { useErrorMessage } from '@/hooks/use-error-message';
import { isProcessing } from '@/lib/link-status';

function Stage({ label, value }: { label: string; value: string }) {
  const t = useTranslations('links.processing.stage');
  const running = value === 'PENDING' || value === 'PROCESSING';
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-medium">
        {running && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
        {t.has(value) ? t(value) : value}
      </span>
    </div>
  );
}

/**
 * Live processing state (security scan → metadata extraction → optional AI). Polls while running,
 * explains failures and offers re-analysis (POST /links/{id}/reanalyze, 20/hour).
 */
export function ProcessingPanel({ link }: { link: OwnedLink }) {
  const t = useTranslations('links.processing');
  const errorMessage = useErrorMessage();
  const poll = useProcessingPoll(link);
  const reanalyze = useReanalyze(link.public_id);
  const processing: Processing = poll.data ?? link.processing;
  const status = processing.status;

  const reanalyzeButton = (
    <Button
      size="sm"
      variant="outline"
      className="mt-2"
      loading={reanalyze.isPending}
      onClick={() =>
        reanalyze.mutate(undefined, { onSuccess: (r) => toast.success(r.message ?? t('reanalyzeQueued')), onError: (e) => toast.error(errorMessage(e)) })
      }
    >
      <RefreshCw aria-hidden /> {t('reanalyze')}
    </Button>
  );

  if (isProcessing(status)) {
    return (
      <div className="rounded-xl border bg-card p-4" role="status" aria-live="polite">
        <div className="mb-3 flex items-center gap-2 font-medium">
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          {processing.extraction_error_code ? t('retryingTitle') : t('runningTitle')}
        </div>
        <p className="mb-3 text-sm text-muted-foreground">{processing.extraction_error_code ? t('retryingBody') : t('runningBody')}</p>
        {processing.extraction_error_code && (
          <p className="-mt-2 mb-3 font-mono text-xs text-muted-foreground" title={t('technicalCode')}>
            {processing.extraction_error_code}
          </p>
        )}
        <div className="grid gap-1.5 rounded-lg bg-muted/60 p-3">
          <Stage label={t('stages.security')} value={processing.security} />
          <Stage label={t('stages.extraction')} value={processing.extraction} />
          <Stage label={t('stages.ai')} value={processing.ai_enabled ? processing.ai : 'DISABLED'} />
        </div>
      </div>
    );
  }

  const securityStatus = processing.security ?? link.security.status;
  const notCleared = (status === 'COMPLETED' || status === 'PARTIAL') && securityStatus !== 'CLEAR';
  const securityNotice = notCleared ? (
    <Alert variant="info" data-testid="ready-not-cleared">
      <ShieldQuestion aria-hidden />
      <AlertTitle>{t('readyNotClearedTitle')}</AlertTitle>
      <AlertDescription>
        {t(`readyNotCleared.${securityStatus === 'UNKNOWN' && link.permissions.can_publish ? 'UNKNOWN_ALLOWED' : securityStatus}`)}
      </AlertDescription>
    </Alert>
  ) : null;

  if (status === 'FAILED') {
    return (
      <Alert variant="warning">
        <AlertTriangle aria-hidden />
        <AlertTitle>{t('failedTitle')}</AlertTitle>
        <AlertDescription>
          <p>{t('failedBody')}</p>
          {processing.extraction_error_code && <p className="font-mono text-xs opacity-80">{processing.extraction_error_code}</p>}
          {reanalyzeButton}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'PARTIAL') {
    return (
      <div className="grid gap-3">
        <Alert variant="info">
          <AlertTriangle aria-hidden />
          <AlertTitle>{t('partialTitle')}</AlertTitle>
          <AlertDescription>
            <p>{t('partialBody')}</p>
            {reanalyzeButton}
          </AlertDescription>
        </Alert>
        {securityNotice}
      </div>
    );
  }

  if (status === 'BLOCKED') {
    return (
      <Alert variant="destructive">
        <Ban aria-hidden />
        <AlertTitle>{t('blockedTitle')}</AlertTitle>
        <AlertDescription>
          <p>{link.security.status === 'SUSPICIOUS' || link.security.status === 'MALICIOUS' ? t('blockedSecurity') : t('blockedSource')}</p>
        </AlertDescription>
      </Alert>
    );
  }

  return securityNotice;
}
