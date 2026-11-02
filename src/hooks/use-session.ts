'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/endpoints';
import { isApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/query-keys';
import type { User } from '@/lib/api/types';

/**
 * Current signed-in user from GET /auth/me (401 → guest = null).
 * `status`: "loading" until the first answer, then "authenticated" | "guest".
 */
export function useSession() {
  const query = useQuery<User | null>({
    queryKey: queryKeys.session,
    queryFn: async ({ signal }) => {
      try {
        return await authApi.me(signal);
      } catch (error) {
        if (isApiError(error) && (error.status === 401 || error.status === 419)) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: (count, error) => !(isApiError(error) && error.status < 500 && error.status !== 0) && count < 2,
  });

  const user = query.data ?? null;
  const status: 'loading' | 'authenticated' | 'guest' | 'error' = query.isPending
    ? 'loading'
    : query.isError && query.data === undefined
      ? 'error'
      : user
        ? 'authenticated'
        : 'guest';

  return { user, status, isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

export function useSetSessionUser() {
  const queryClient = useQueryClient();
  return (user: User | null) => queryClient.setQueryData(queryKeys.session, user);
}
