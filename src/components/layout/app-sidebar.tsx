'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/use-session';
import { useUnreadCount } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { DASHBOARD_NAV, isActive } from './dashboard-nav';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user } = useSession();
  const unread = useUnreadCount();

  return (
    <nav aria-label={t('dashboardNav')} className="flex flex-1 flex-col gap-6 px-3 py-4">
      {DASHBOARD_NAV.map((group, index) => (
        <ul key={index} className="flex flex-col gap-0.5">
          {group
            .filter((item) => !item.adminOnly || user?.is_admin)
            .map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-accent hover:text-foreground',
                      active && 'bg-brand-soft font-medium text-brand-soft-foreground hover:bg-brand-soft hover:text-brand-soft-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{t(item.key)}</span>
                    {item.key === 'notifications' && unread > 0 && (
                      <Badge variant="brand" className="ms-auto tabular-nums">
                        {unread > 99 ? '99+' : unread}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>
      ))}
    </nav>
  );
}

export function AppSidebar() {
  const t = useTranslations('nav');
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/" className="rounded-md">
          <Logo />
        </Link>
      </div>
      <SidebarNav />
      <div className="border-t border-sidebar-border p-4 text-xs text-muted-foreground">
        <Link href="/explore" className="hover:text-foreground">
          {t('explore')}
        </Link>
      </div>
    </aside>
  );
}
