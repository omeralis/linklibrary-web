'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { isApiError, isKnownErrorCode } from '@/lib/api/errors';

/**
 * Maps any thrown value to a localized, user-facing sentence.
 * Order: dedicated translation for the error code → backend message (already localized by the API
 * from Accept-Language) → generic fallback. Never exposes stack traces or raw payloads.
 */
export function useErrorMessage() {
  const t = useTranslations('errors');
  return useCallback(
    (error: unknown): string => {
      if (!isApiError(error)) return t('generic');
      if (error.code === 'RATE_LIMITED' && error.retryAfter) return t('rateLimitedRetry', { seconds: error.retryAfter });
      if (error.code === 'VALIDATION_ERROR' || error.code === 'INVALID_URL' || error.code === 'URL_NOT_ALLOWED') {
        const first = Object.values(error.errors)[0]?.[0];
        if (first) return first;
      }
      if (isKnownErrorCode(error.code)) return t(`codes.${error.code}`);
      if (error.message) return error.message;
      return error.isServer ? t('codes.SERVER_ERROR') : t('generic');
    },
    [t],
  );
}
