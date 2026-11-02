'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { authApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { useRouter } from '@/i18n/navigation';

/** POST /auth/logout, then wipe every cached query so no private data survives in memory. */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = useTranslations('auth');
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // Even if the request failed (e.g. session already expired) the local state is cleared.
      queryClient.cancelQueries();
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, null);
      toast.success(t('loggedOut'));
      router.replace('/login');
    },
  });
}
