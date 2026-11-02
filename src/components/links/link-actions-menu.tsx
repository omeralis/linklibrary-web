'use client';

import * as React from 'react';
import { Copy, FolderPlus, MoreHorizontal, Pencil, RotateCcw, Star, Trash2, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import type { OwnedLink } from '@/lib/api/types';
import { useDeleteLink, useRestoreLink, useToggleFavorite } from '@/hooks/use-links';
import { useErrorMessage } from '@/hooks/use-error-message';
import { AddToCollectionDialog } from './add-to-collection-dialog';

export function LinkActionsMenu({ link, trashed = false }: { link: OwnedLink; trashed?: boolean }) {
  const t = useTranslations('links.actions');
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const [confirm, setConfirm] = React.useState<null | 'delete' | 'permanent'>(null);
  const [collectionsOpen, setCollectionsOpen] = React.useState(false);
  const remove = useDeleteLink();
  const restore = useRestoreLink();
  const favorite = useToggleFavorite();

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.frontend_url);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t('menu', { title: link.title })}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {trashed ? (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  restore.mutate(link.public_id, {
                    onSuccess: () => toast.success(t('restored')),
                    onError: (e) => toast.error(errorMessage(e)),
                  })
                }
              >
                <RotateCcw aria-hidden /> {t('restore')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm('permanent')}>
                <Trash2 aria-hidden /> {t('deletePermanently')}
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => router.push(`/dashboard/links/${link.public_id}`)}>
                <Eye aria-hidden /> {t('details')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push(`/dashboard/links/${link.public_id}?tab=edit`)}>
                <Pencil aria-hidden /> {t('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => favorite.mutate({ id: link.public_id, favorite: !link.is_favorite }, { onError: (e) => toast.error(errorMessage(e)) })}
              >
                <Star aria-hidden /> {link.is_favorite ? t('unfavorite') : t('favorite')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCollectionsOpen(true)}>
                <FolderPlus aria-hidden /> {t('addToCollection')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copy}>
                <Copy aria-hidden /> {t('copyLink')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm('delete')}>
                <Trash2 aria-hidden /> {t('delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === 'permanent' ? t('confirmPermanentTitle') : t('confirmDeleteTitle')}
        description={confirm === 'permanent' ? t('confirmPermanentBody') : t('confirmDeleteBody')}
        confirmLabel={confirm === 'permanent' ? t('deletePermanently') : t('delete')}
        onConfirm={() =>
          remove.mutateAsync(
            { id: link.public_id, permanent: confirm === 'permanent' },
            {
              onSuccess: () => toast.success(confirm === 'permanent' ? t('deletedPermanently') : t('deleted')),
              onError: (e) => toast.error(errorMessage(e)),
            },
          )
        }
      />
      <AddToCollectionDialog open={collectionsOpen} onOpenChange={setCollectionsOpen} linkIds={[link.public_id]} />
    </>
  );
}
