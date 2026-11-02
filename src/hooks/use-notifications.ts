'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { NOTIFICATIONS_POLL_MS } from '@/lib/api/config';
import { useSession } from './use-session';

/** Unread badge count, polled (the backend has no real-time push). Paused while the tab is hidden. */
export function useUnreadCount(): number {
  const { user } = useSession();
  const query = useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: ({ signal }) => notificationsApi.unreadCount(signal),
    enabled: !!user,
    refetchInterval: NOTIFICATIONS_POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });
  return query.data ?? 0;
}

export function useNotifications(params: { page?: number; unread?: boolean }, enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationsApi.list(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}
