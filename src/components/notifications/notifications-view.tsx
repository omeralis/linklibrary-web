'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { PaginationBar } from '@/components/common/pagination-bar';
import type { AppNotification } from '@/lib/api/types';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadCount } from '@/hooks/use-notifications';
import { useUrlState } from '@/hooks/use-url-state';
import { useErrorMessage } from '@/hooks/use-error-message';
import { cn } from '@/lib/utils';
import { NotificationItem, notificationHref } from './notification-item';

export function NotificationsView() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const { values, set, page } = useUrlState();
  const unreadOnly = values.filter === 'unread';
  const list = useNotifications({ page, unread: unreadOnly || undefined });
  const unread = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  function open(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id);
    const href = notificationHref(n);
    if (href) router.push(href);
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button
            variant="outline"
            disabled={unread === 0}
            loading={markAll.isPending}
            onClick={() =>
              markAll.mutate(undefined, { onSuccess: (r) => toast.success(r.message ?? t('allRead')), onError: (e) => toast.error(errorMessage(e)) })
            }
          >
            <CheckCheck aria-hidden /> {t('markAllRead')}
          </Button>
        }
      />
      <SegmentedControl
        className="mb-4"
        label={t('title')}
        value={unreadOnly ? 'unread' : 'all'}
        onValueChange={(v) => set({ filter: v === 'unread' ? 'unread' : null })}
        options={[
          { value: 'all', label: t('all') },
          { value: 'unread', label: t('unread', { count: unread }) },
        ]}
      />
      {list.isError && !list.data ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : list.isPending ? (
        <div className="grid gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : list.data.items.length === 0 ? (
        <EmptyState icon={Bell} title={unreadOnly ? t('noUnread') : t('empty')} description={t('emptyBody')} />
      ) : (
        <>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {list.data.items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={cn(
                    'w-full px-4 py-3.5 text-start transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                    !n.read && 'bg-brand-soft/25',
                  )}
                >
                  <NotificationItem notification={n} />
                </button>
              </li>
            ))}
          </ul>
          <PaginationBar pagination={list.data.pagination} onPageChange={(p) => set({ page: p })} />
        </>
      )}
    </div>
  );
}
