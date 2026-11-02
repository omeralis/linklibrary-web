'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/hooks/use-session';
import { cn } from '@/lib/utils';
import { LocaleSwitcher, LocaleSwitcherFallback } from './locale-switcher';
import { ThemeSwitcher } from './theme-switcher';
import { UserMenu } from './user-menu';

const NAV = [
  { href: '/explore', key: 'explore' },
  { href: '/#how-it-works', key: 'howItWorks' },
  { href: '/#security', key: 'security' },
  { href: '/about', key: 'about' },
] as const;

export function SiteHeader() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, status } = useSession();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label={t('primary')} className="ms-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
                pathname === item.href && 'font-medium text-foreground',
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <React.Suspense fallback={<LocaleSwitcherFallback />}>
            <LocaleSwitcher />
          </React.Suspense>
          <ThemeSwitcher />
          <div className="ms-2 hidden items-center gap-2 sm:flex">
            {status === 'loading' ? (
              <Skeleton className="h-9 w-28" />
            ) : user ? (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">{t('dashboard')}</Link>
                </Button>
                <UserMenu user={user} />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{t('login')}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">{t('getStarted')}</Link>
                </Button>
              </>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('openMenu')}>
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="end" className="p-0">
              <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
              <div className="border-b p-4">
                <Logo />
              </div>
              <nav aria-label={t('primary')} className="flex flex-col gap-1 p-3" onClick={() => setOpen(false)}>
                {NAV.map((item) => (
                  <Link key={item.key} href={item.href} className="rounded-md px-3 py-2.5 text-sm hover:bg-accent">
                    {t(item.key)}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t p-4" onClick={() => setOpen(false)}>
                {user ? (
                  <Button asChild>
                    <Link href="/dashboard">{t('dashboard')}</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild>
                      <Link href="/register">{t('getStarted')}</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/login">{t('login')}</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
