'use client';

import * as React from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Copy, ExternalLink, GripVertical, MoreHorizontal, Pencil, Plus, Trash2, X, FolderOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LinkFavicon } from '@/components/common/link-favicon';
import { ProcessingBadge, SecurityBadge, VisibilityBadge } from '@/components/links/status-badges';
import type { OwnedLink } from '@/lib/api/types';
import { useCollection, useDeleteCollection, useRemoveLinkFromCollection, useReorderCollection } from '@/hooks/use-collections';
import { useErrorMessage } from '@/hooks/use-error-message';
import { cn } from '@/lib/utils';
import { AddLinksDialog } from './add-links-dialog';
import { CollectionFormDialog } from './collection-form-dialog';

export function CollectionDetailView({ id }: { id: string }) {
  const t = useTranslations('collections.detail');
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const query = useCollection(id);
  const reorder = useReorderCollection(id);
  const remove = useDeleteCollection();
  const [editOpen, setEditOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const collection = query.data;
  const items = collection.items ?? [];

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.public_id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    reorder.mutate(next, { onSuccess: () => toast.success(t('reordered')), onError: (e) => toast.error(errorMessage(e)) });
  }

  async function copyPublic() {
    try {
      await navigator.clipboard.writeText(collection.frontend_url);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ms-2 mb-4 text-muted-foreground">
        <Link href="/dashboard/collections">
          <ArrowLeft className="rtl-flip" aria-hidden /> {t('back')}
        </Link>
      </Button>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">{collection.visibility && <VisibilityBadge visibility={collection.visibility} />}</div>
          <h1 className="text-2xl font-semibold tracking-tight break-words">{collection.name}</h1>
          {collection.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{collection.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={() => setAddOpen(true)}>
            <Plus aria-hidden /> {t('addLinks')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t('more')}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil aria-hidden /> {t('edit')}
              </DropdownMenuItem>
              {collection.visibility === 'PUBLIC' && (
                <>
                  <DropdownMenuItem onSelect={copyPublic}>
                    <Copy aria-hidden /> {t('copyPublicLink')}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/c/${collection.public_id}`}>
                      <ExternalLink aria-hidden /> {t('viewPublic')}
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden /> {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {collection.visibility === 'PUBLIC' && <p className="mb-4 rounded-lg bg-info-soft px-3 py-2 text-sm text-info-foreground">{t('publicNote')}</p>}

      {items.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t('emptyTitle')}
          description={t('emptyBody')}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus aria-hidden /> {t('addLinks')}
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground" id="reorder-hint">
            {t('reorderHint')}
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.public_id)} strategy={verticalListSortingStrategy}>
              <ul className="grid gap-2" aria-describedby="reorder-hint">
                {items.map((link) => (
                  <SortableLinkRow key={link.public_id} link={link} collectionId={id} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}

      <CollectionFormDialog open={editOpen} onOpenChange={setEditOpen} collection={collection} />
      <AddLinksDialog open={addOpen} onOpenChange={setAddOpen} collectionId={id} existing={items.map((i) => i.public_id)} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('deleteTitle')}
        description={t('deleteBody')}
        confirmLabel={t('delete')}
        onConfirm={() =>
          remove.mutateAsync(id, {
            onSuccess: () => {
              toast.success(t('deleted'));
              router.push('/dashboard/collections');
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </div>
  );
}

function SortableLinkRow({ link, collectionId }: { link: OwnedLink; collectionId: string }) {
  const t = useTranslations('collections.detail');
  const errorMessage = useErrorMessage();
  const removeLink = useRemoveLinkFromCollection(collectionId);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.public_id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-3 rounded-lg border bg-card px-2 py-2.5 shadow-xs', isDragging && 'z-10 shadow-md ring-2 ring-ring/30')}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
        aria-label={t('dragHandle', { title: link.title })}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <LinkFavicon src={link.favicon_url} />
      <div className="min-w-0 flex-1">
        <Link href={`/dashboard/links/${link.public_id}`} className="block truncate text-sm font-medium hover:underline">
          {link.title}
        </Link>
        <span className="block truncate text-xs text-muted-foreground" dir="ltr">
          {link.hostname}
        </span>
      </div>
      <div className="hidden items-center gap-1.5 sm:flex">
        <ProcessingBadge status={link.processing_status} />
        <SecurityBadge status={link.security.status} hideWhenClear />
        {link.visibility === 'PRIVATE' && <VisibilityBadge visibility="PRIVATE" />}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('removeLink', { title: link.title })}
        disabled={removeLink.isPending}
        onClick={() => removeLink.mutate(link.public_id, { onSuccess: () => toast.success(t('linkRemoved')), onError: (e) => toast.error(errorMessage(e)) })}
      >
        <X aria-hidden />
      </Button>
    </li>
  );
}
