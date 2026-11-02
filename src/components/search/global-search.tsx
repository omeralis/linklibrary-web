'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Link2, Plus, Search as SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { searchApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { linkHref } from '@/lib/link-status';
import { DASHBOARD_NAV } from '@/components/layout/dashboard-nav';
import { useAddLink } from '@/components/links/add-link-provider';
import { LinkFavicon } from '@/components/common/link-favicon';

interface GlobalSearchContext {
  open: () => void;
}

const Ctx = React.createContext<GlobalSearchContext>({ open: () => undefined });

export function useGlobalSearch() {
  return React.useContext(Ctx);
}

/** Ctrl/⌘+K command palette: searches own + shared links and collections (GET /search). */
export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const value = React.useMemo(() => ({ open: () => setOpen(true) }), []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Ctx.Provider value={value}>
      {children}
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </Ctx.Provider>
  );
}

function GlobalSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations('search');
  const nav = useTranslations('nav');
  const router = useRouter();
  const addLink = useAddLink();
  const [term, setTerm] = React.useState('');
  const q = useDebouncedValue(term.trim(), 250);
  const enabled = open && q.length >= 2;

  const links = useQuery({
    queryKey: queryKeys.search({ q, scope: 'all', per_page: 6 }),
    queryFn: ({ signal }) => searchApi.links({ q, scope: 'all', per_page: 6 }, signal),
    enabled,
  });
  const collections = useQuery({
    queryKey: queryKeys.search({ q, type: 'collections', per_page: 4 }),
    queryFn: ({ signal }) => searchApi.collections({ q, per_page: 4 }, signal),
    enabled,
  });

  function go(href: string) {
    onOpenChange(false);
    setTerm('');
    router.push(href);
  }

  const loading = enabled && (links.isFetching || collections.isFetching);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">{t('paletteTitle')}</DialogTitle>
        <DialogDescription className="sr-only">{t('paletteDescription')}</DialogDescription>
        <Command shouldFilter={false} loop>
          <CommandInput value={term} onValueChange={setTerm} placeholder={t('palettePlaceholder')} aria-label={t('palettePlaceholder')} />
          <CommandList>
            {enabled && !loading && (links.data?.items.length ?? 0) === 0 && (collections.data?.items.length ?? 0) === 0 && (
              <CommandEmpty>{t('noResults')}</CommandEmpty>
            )}
            {loading && <p className="px-4 py-3 text-sm text-muted-foreground">{t('searching')}</p>}
            {q.length >= 2 && (
              <CommandGroup>
                <CommandItem value={`all:${q}`} onSelect={() => go(`/dashboard/search?q=${encodeURIComponent(q)}`)}>
                  <SearchIcon aria-hidden />
                  {t('seeAll', { q })}
                </CommandItem>
              </CommandGroup>
            )}
            {(links.data?.items.length ?? 0) > 0 && (
              <CommandGroup heading={t('links')}>
                {links.data!.items.map((link) => (
                  <CommandItem key={link.public_id} value={`link:${link.public_id}`} onSelect={() => go(linkHref(link))}>
                    <LinkFavicon src={link.favicon_url} />
                    <span className="truncate">{link.title}</span>
                    <span className="ms-auto truncate text-xs text-muted-foreground" dir="ltr">
                      {link.hostname}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {(collections.data?.items.length ?? 0) > 0 && (
              <CommandGroup heading={t('collections')}>
                {collections.data!.items.map((c) => (
                  <CommandItem key={c.public_id} value={`collection:${c.public_id}`} onSelect={() => go(`/dashboard/collections/${c.public_id}`)}>
                    <FolderOpen aria-hidden />
                    <span className="truncate">{c.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {q.length < 2 && (
              <>
                <CommandGroup heading={t('actions')}>
                  <CommandItem
                    value="action:add-link"
                    onSelect={() => {
                      onOpenChange(false);
                      addLink.open();
                    }}
                  >
                    <Plus aria-hidden />
                    {nav('addLink')}
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading={t('goTo')}>
                  {DASHBOARD_NAV.flat()
                    .filter((i) => !i.adminOnly)
                    .map((item) => {
                      const Icon = item.icon ?? Link2;
                      return (
                        <CommandItem key={item.href} value={`nav:${item.href}`} onSelect={() => go(item.href)}>
                          <Icon aria-hidden />
                          {nav(item.key)}
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
