'use client';

import * as React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadCount } from '@/hooks/use-notifications';
import { NotificationItem, notificationHref } from '@/components/notifications/notification-item';
import type { AppNotification } from '@/lib/api/types';

export function NotificationsBell() {
  const t = useTranslations('notifications');
  const [open, setOpen] = React.useState(false);
  const unread = useUnreadCount();
  const list = useNotifications({ page: 1 }, open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const router = useRouter();

  function select(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id);
    const href = notificationHref(n);
    setOpen(false);
    if (href) router.push(href);
  }

  const items = list.data?.items.slice(0, 8) ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread > 0 ? t('bellUnread', { count: unread }) : t('bell')}>
          <Bell aria-hidden />
          {unread > 0 && (
            <span className="absolute end-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground tabular-nums">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">{t('title')}</p>
          <Button variant="ghost" size="sm" onClick={() => markAll.mutate()} disabled={unread === 0 || markAll.isPending}>
            <CheckCheck aria-hidden />
            {t('markAllRead')}
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {list.isPending ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : list.isError ? (
            <p className="p-4 text-sm text-muted-foreground">{t('loadFailed')}</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => select(n)}
                    className="w-full px-4 py-3 text-start transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  >
                    <NotificationItem notification={n} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full" onClick={() => setOpen(false)}>
            <Link href="/dashboard/notifications">{t('viewAll')}</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
