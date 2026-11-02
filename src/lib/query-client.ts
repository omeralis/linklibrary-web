import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, isApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/query-keys';

export interface QueryClientHooks {
  /** Called when any request reports that the session is gone (401) or the account is suspended. */
  onSessionLost?: (reason: 'expired' | 'suspended') => void;
}

/** Retry policy: never retry client errors (4xx) except 408/429; retry network/5xx failures twice with backoff. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return failureCount < 2;
  if (error.code === 'ABORTED') return false;
  if (error.status === 429) return failureCount < 1;
  if (error.status === 408) return failureCount < 2;
  if (error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function retryDelay(attempt: number, error: unknown): number {
  if (error instanceof ApiError && error.retryAfter) return Math.min(error.retryAfter * 1000, 30_000);
  return Math.min(1000 * 2 ** attempt, 8_000);
}

export function createQueryClient(hooks: QueryClientHooks = {}): QueryClient {
  const handleAuthError = (error: unknown, key?: readonly unknown[]) => {
    if (!isApiError(error)) return;
    const isSessionQuery = key?.[0] === queryKeys.session[0];
    if (error.status === 401 && !isSessionQuery && client.getQueryData(queryKeys.session)) {
      client.setQueryData(queryKeys.session, null);
      hooks.onSessionLost?.('expired');
    }
    if (error.code === 'ACCOUNT_SUSPENDED') {
      client.setQueryData(queryKeys.session, null);
      hooks.onSessionLost?.('suspended');
    }
  };

  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: (error, query) => handleAuthError(error, query.queryKey) }),
    mutationCache: new MutationCache({ onError: (error) => handleAuthError(error) }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        retryDelay,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
  return client;
}
