'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Copy, FolderPlus, Star, Trash2, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ErrorState } from '@/components/common/error-state';
import { LinkFavicon } from '@/components/common/link-favicon';
import { OwnerSharingPanel } from '@/components/sharing/owner-sharing-panel';
import { isOwnedLink } from '@/lib/api/types';
import { useDeleteLink, useLink, useRestoreLink, useToggleFavorite } from '@/hooks/use-links';
import { useSession } from '@/hooks/use-session';
import { useErrorMessage } from '@/hooks/use-error-message';
import { cn } from '@/lib/utils';
import { AddToCollectionDialog } from './add-to-collection-dialog';
import { LinkEditForm } from './link-edit-form';
import { LinkOverview } from './link-overview';
import { OpenLinkButton } from './open-link-button';
import { ProcessingPanel } from './processing-panel';
import { SecurityPanel } from './security-panel';
import { LinkStatusSummary } from './status-badges';

const TABS = ['overview', 'edit', 'security', 'sharing'] as const;
type Tab = (typeof TABS)[number];

export function LinkDetailView({ id }: { id: string }) {
  const t = useTranslations('links.detail');
  const ta = useTranslations('links.actions');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const errorMessage = useErrorMessage();
  const query = useLink(id);
  const favorite = useToggleFavorite();
  const remove = useDeleteLink();
  const restore = useRestoreLink();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [collectionsOpen, setCollectionsOpen] = React.useState(false);

  const tabParam = searchParams.get('tab') as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'overview';
  const setTab = (next: string) => router.replace(next === 'overview' ? pathname : `${pathname}?tab=${next}`, { scroll: false });

  // Links shared with me (viewer) or public ones are shown on the read-only page.
  React.useEffect(() => {
    if (query.data && !isOwnedLink(query.data)) router.replace(`/l/${id}`);
  }, [query.data, id, router]);

  if (query.isPending) return <DetailSkeleton />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const link = query.data;
  if (!isOwnedLink(link) || !user) return <DetailSkeleton />;
  const trashed = !!link.deleted_at;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.frontend_url);
      toast.success(ta('copied'));
    } catch {
      toast.error(ta('copyFailed'));
    }
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ms-2 mb-4 text-muted-foreground">
        <Link href="/dashboard/links">
          <ArrowLeft className="rtl-flip" aria-hidden /> {t('back')}
        </Link>
      </Button>

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <LinkFavicon src={link.favicon_url} />
            <span dir="ltr" className="truncate">
              {link.site_name || link.hostname}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance break-words">
            <bdi>{link.title}</bdi>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <LinkStatusSummary processing={link.processing_status} security={link.security.status} visibility={link.visibility} />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {trashed ? (
            <Button
              onClick={() => restore.mutate(link.public_id, { onSuccess: () => toast.success(ta('restored')), onError: (e) => toast.error(errorMessage(e)) })}
              loading={restore.isPending}
            >
              <RotateCcw aria-hidden /> {ta('restore')}
            </Button>
          ) : (
            <>
              <OpenLinkButton link={link} variant="default" size="default" />
              <Button
                variant="outline"
                aria-pressed={link.is_favorite}
                onClick={() => favorite.mutate({ id: link.public_id, favorite: !link.is_favorite }, { onError: (e) => toast.error(errorMessage(e)) })}
              >
                <Star className={cn(link.is_favorite && 'fill-warning text-warning')} aria-hidden />
                {link.is_favorite ? ta('unfavorite') : ta('favorite')}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCollectionsOpen(true)} aria-label={ta('addToCollection')}>
                <FolderPlus aria-hidden />
              </Button>
              <Button variant="outline" size="icon" onClick={copy} aria-label={ta('copyLink')}>
                <Copy aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                aria-label={ta('delete')}
              >
                <Trash2 aria-hidden />
              </Button>
            </>
          )}
        </div>
      </header>

      {trashed && (
        <Alert variant="warning" className="mb-6">
          <AlertDescription>{t('inTrash')}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <ProcessingPanel link={link} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-2">
          {TABS.map((key) => (
            <TabsTrigger key={key} value={key} disabled={trashed && key !== 'overview'}>
              {t(`tabs.${key}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <LinkOverview link={link} />
        </TabsContent>
        <TabsContent value="edit">
          <LinkEditForm link={link} />
        </TabsContent>
        <TabsContent value="security">
          <SecurityPanel link={link} />
        </TabsContent>
        <TabsContent value="sharing">
          <OwnerSharingPanel link={link} user={user} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={ta('confirmDeleteTitle')}
        description={ta('confirmDeleteBody')}
        confirmLabel={ta('delete')}
        onConfirm={() =>
          remove.mutateAsync(
            { id: link.public_id },
            {
              onSuccess: () => {
                toast.success(ta('deleted'));
                router.push('/dashboard/links');
              },
              onError: (e) => toast.error(errorMessage(e)),
            },
          )
        }
      />
      <AddToCollectionDialog open={collectionsOpen} onOpenChange={setCollectionsOpen} linkIds={[link.public_id]} />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy>
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-6 h-9 w-80" />
      <Skeleton className="h-64" />
    </div>
  );
}
