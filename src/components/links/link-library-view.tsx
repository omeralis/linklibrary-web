'use client';

import * as React from 'react';
import { Archive, Bookmark, Library, Plus, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { PaginationBar } from '@/components/common/pagination-bar';
import type { LinkListParams, LinkSort, SecurityStatus, SourceType, Visibility } from '@/lib/api/types';
import { useLinksList } from '@/hooks/use-links';
import { useUrlState } from '@/hooks/use-url-state';
import { useAddLink } from './add-link-provider';
import { LinkFilters, useViewPreference, type FilterState } from './link-filters';
import { LinkGrid } from './link-card';

const SORTS = ['latest', 'oldest', 'title', 'popular', 'relevance'] as const;

/** "My library" (all saved links) and "Favorites" (favorite=1). Filters live in the URL. */
export function LinkLibraryView({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const t = useTranslations('links.library');
  const { values, set, page } = useUrlState();
  const [view, setView] = useViewPreference();
  const addLink = useAddLink();
  const trashed = !favoritesOnly && values.trashed === 'only';

  const filters: FilterState = {
    q: values.q ?? '',
    category: values.category ?? '',
    tag: values.tag ?? '',
    source_type: values.source_type ?? '',
    visibility: values.visibility ?? '',
    security_status: values.security_status ?? '',
    sort: values.sort ?? '',
  };

  const params: LinkListParams = {
    q: filters.q || undefined,
    category: filters.category || undefined,
    tag: filters.tag || undefined,
    source_type: (filters.source_type || undefined) as SourceType | undefined,
    visibility: (filters.visibility || undefined) as Visibility | undefined,
    security_status: (filters.security_status || undefined) as SecurityStatus | undefined,
    sort: (filters.sort || (filters.q ? 'relevance' : 'latest')) as LinkSort,
    favorite: favoritesOnly || undefined,
    trashed: trashed ? 'only' : undefined,
    page,
    per_page: 24,
  };
  const list = useLinksList(params);
  const filtered = Object.entries(filters).some(([k, v]) => k !== 'sort' && v);

  return (
    <div>
      <PageHeader
        title={favoritesOnly ? t('favoritesTitle') : t('title')}
        description={favoritesOnly ? t('favoritesDescription') : t('description')}
        actions={
          <Button onClick={() => addLink.open()}>
            <Plus aria-hidden /> {t('add')}
          </Button>
        }
      />
      {!favoritesOnly && (
        <SegmentedControl
          className="mb-4"
          label={t('title')}
          value={trashed ? 'trash' : 'all'}
          onValueChange={(v) => set({ trashed: v === 'trash' ? 'only' : null })}
          options={[
            {
              value: 'all',
              label: (
                <>
                  <Library aria-hidden /> {t('tabAll')}
                </>
              ),
            },
            {
              value: 'trash',
              label: (
                <>
                  <Archive aria-hidden /> {t('tabTrash')}
                </>
              ),
            },
          ]}
        />
      )}
      <LinkFilters
        values={filters}
        onChange={(patch) => set(patch)}
        view={view}
        onViewChange={setView}
        options={{ visibility: true, security: true, sorts: SORTS }}
      />
      {list.isError && !list.data ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : list.isPending ? (
        <LinkGrid view={view} loading />
      ) : list.data.items.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={Library}
            title={t('noMatchesTitle')}
            description={t('noMatchesBody')}
            action={
              <Button variant="outline" onClick={() => set({ q: null, category: null, tag: null, source_type: null, visibility: null, security_status: null })}>
                {t('clearFilters')}
              </Button>
            }
          />
        ) : trashed ? (
          <EmptyState icon={Archive} title={t('trashEmptyTitle')} description={t('trashEmptyBody')} />
        ) : favoritesOnly ? (
          <EmptyState icon={Star} title={t('favoritesEmptyTitle')} description={t('favoritesEmptyBody')} />
        ) : (
          <EmptyState
            icon={Bookmark}
            title={t('emptyTitle')}
            description={t('emptyBody')}
            action={
              <Button onClick={() => addLink.open()}>
                <Plus aria-hidden /> {t('addFirst')}
              </Button>
            }
          />
        )
      ) : (
        <div className={list.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          {trashed && <p className="mb-3 text-sm text-muted-foreground">{t('trashHint')}</p>}
          <LinkGrid links={list.data.items} view={view} trashed={trashed} />
          <PaginationBar pagination={list.data.pagination} onPageChange={(p) => set({ page: p })} />
        </div>
      )}
    </div>
  );
}
