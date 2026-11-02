'use client';

import * as React from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAddLinksToCollection, useCollections, useCreateCollection } from '@/hooks/use-collections';
import { useErrorMessage } from '@/hooks/use-error-message';

/** Adds one or more saved links to one or more collections (POST /collections/{id}/links). */
export function AddToCollectionDialog({ open, onOpenChange, linkIds }: { open: boolean; onOpenChange: (open: boolean) => void; linkIds: string[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <AddToCollectionBody onClose={() => onOpenChange(false)} linkIds={linkIds} />}</DialogContent>
    </Dialog>
  );
}

/** Mounted only while the dialog is open, so its local state starts fresh every time. */
function AddToCollectionBody({ onClose, linkIds }: { onClose: () => void; linkIds: string[] }) {
  const t = useTranslations('collections.addTo');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const collections = useCollections();
  const add = useAddLinksToCollection();
  const create = useCreateCollection();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [newName, setNewName] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function createCollection() {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await create.mutateAsync({ name, visibility: 'PRIVATE' });
      setSelected((s) => [...s, res.data.public_id]);
      setNewName('');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function save() {
    setSaving(true);
    try {
      let added = 0;
      for (const id of selected) {
        const res = await add.mutateAsync({ id, links: linkIds });
        added += res.data.added;
      }
      toast.success(t('added', { count: added }));
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>{t('description', { count: linkIds.length })}</DialogDescription>
      </DialogHeader>
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {collections.isPending ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9" />)
        ) : (collections.data?.items.length ?? 0) === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('none')}</p>
        ) : (
          collections.data!.items.map((c) => {
            const checked = selected.includes(c.public_id);
            const id = `col-${c.public_id}`;
            return (
              <label key={c.public_id} htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(v) => setSelected((s) => (v ? [...s, c.public_id] : s.filter((x) => x !== c.public_id)))}
                />
                <FolderOpen className="size-4 text-muted-foreground" aria-hidden />
                <span className="flex-1 truncate text-sm">{c.name}</span>
                {c.items_count !== null && <span className="text-xs text-muted-foreground tabular-nums">{c.items_count}</span>}
              </label>
            );
          })
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              createCollection();
            }
          }}
          placeholder={t('newPlaceholder')}
          aria-label={t('newPlaceholder')}
          maxLength={120}
        />
        <Button variant="outline" onClick={createCollection} loading={create.isPending} disabled={!newName.trim()}>
          <Plus aria-hidden /> {t('create')}
        </Button>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {tc('cancel')}
        </Button>
        <Button onClick={save} loading={saving} disabled={selected.length === 0}>
          {t('save')}
        </Button>
      </DialogFooter>
    </>
  );
}
