'use client';

import * as React from 'react';
import { Menu, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/brand/logo';
import type { User } from '@/lib/api/types';
import { useAddLink } from '@/components/links/add-link-provider';
import { useGlobalSearch } from '@/components/search/global-search';
import { LocaleSwitcher, LocaleSwitcherFallback } from './locale-switcher';
import { ThemeSwitcher } from './theme-switcher';
import { UserMenu } from './user-menu';
import { NotificationsBell } from './notifications-bell';
import { SidebarNav } from './app-sidebar';

export function AppTopbar({ user }: { user: User }) {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const addLink = useAddLink();
  const search = useGlobalSearch();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('openMenu')}>
            <Menu aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="start" className="gap-0 bg-sidebar p-0">
          <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
          <div className="flex h-16 items-center border-b px-5">
            <Logo />
          </div>
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <button
        type="button"
        onClick={search.open}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border bg-card px-3 text-start text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent sm:max-w-md"
        aria-haspopup="dialog"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t('searchPlaceholder')}</span>
        <Kbd className="ms-auto hidden sm:inline-flex" aria-hidden>
          Ctrl K
        </Kbd>
      </button>

      <div className="ms-auto flex items-center gap-1">
        <Button size="sm" onClick={() => addLink.open()} className="hidden sm:inline-flex">
          <Plus aria-hidden />
          {t('addLink')}
        </Button>
        <Button size="icon" onClick={() => addLink.open()} className="sm:hidden" aria-label={t('addLink')}>
          <Plus aria-hidden />
        </Button>
        <NotificationsBell />
        <React.Suspense fallback={<LocaleSwitcherFallback />}>
          <LocaleSwitcher />
        </React.Suspense>
        <ThemeSwitcher />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
