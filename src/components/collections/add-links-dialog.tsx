'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkFavicon } from '@/components/common/link-favicon';
import { useLinksList } from '@/hooks/use-links';
import { useAddLinksToCollection } from '@/hooks/use-collections';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useErrorMessage } from '@/hooks/use-error-message';

/** Picks saved links to add to a collection (POST /collections/{id}/links, up to 100 at once). */
export function AddLinksDialog({
  open,
  onOpenChange,
  collectionId,
  existing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  collectionId: string;
  existing: string[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {open && <AddLinksBody onClose={() => onOpenChange(false)} collectionId={collectionId} existing={existing} />}
      </DialogContent>
    </Dialog>
  );
}

function AddLinksBody({ onClose, collectionId, existing }: { onClose: () => void; collectionId: string; existing: string[] }) {
  const t = useTranslations('collections.addLinks');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const [term, setTerm] = React.useState('');
  const q = useDebouncedValue(term.trim(), 300);
  const [selected, setSelected] = React.useState<string[]>([]);
  const list = useLinksList({ q: q.length >= 2 ? q : undefined, per_page: 30, sort: q.length >= 2 ? 'relevance' : 'latest' });
  const add = useAddLinksToCollection();

  const candidates = (list.data?.items ?? []).filter((l) => !existing.includes(l.public_id));

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>{t('description')}</DialogDescription>
      </DialogHeader>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t('search')} aria-label={t('search')} className="ps-9" />
      </div>
      <div className="max-h-80 overflow-y-auto rounded-lg border">
        {list.isPending ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{t('none')}</p>
        ) : (
          <ul className="divide-y">
            {candidates.map((link) => {
              const id = `pick-${link.public_id}`;
              const checked = selected.includes(link.public_id);
              return (
                <li key={link.public_id}>
                  <label htmlFor={id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(v) => setSelected((s) => (v ? [...s, link.public_id] : s.filter((x) => x !== link.public_id)))}
                    />
                    <LinkFavicon src={link.favicon_url} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{link.title}</span>
                      <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                        {link.hostname}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {tc('cancel')}
        </Button>
        <Button
          disabled={selected.length === 0}
          loading={add.isPending}
          onClick={() =>
            add.mutate(
              { id: collectionId, links: selected.slice(0, 100) },
              {
                onSuccess: (r) => {
                  toast.success(t('added', { count: r.data.added }));
                  onClose();
                },
                onError: (e) => toast.error(errorMessage(e)),
              },
            )
          }
        >
          {t('submit', { count: selected.length })}
        </Button>
      </DialogFooter>
    </>
  );
}
