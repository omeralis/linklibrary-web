'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Search as SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { PaginationBar } from '@/components/common/pagination-bar';
import { LinkGrid } from '@/components/links/link-card';
import { CategorySelect } from '@/components/links/category-select';
import { CollectionCard } from '@/components/collections/collection-card';
import { searchApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import type { SearchParams, SourceType } from '@/lib/api/types';
import { SOURCE_TYPES } from '@/lib/validation/schemas';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlState } from '@/hooks/use-url-state';

const ANY = '__any__';

/** Full search over my library (GET /search): scope own/shared/all, links or collections, filters. Arabic-aware on the backend. */
export function SearchView() {
  const t = useTranslations('search');
  const ts = useTranslations('links.sourceTypes');
  const tf = useTranslations('links.filters');
  const { values, set, page } = useUrlState();
  const [term, setTerm] = React.useState(values.q ?? '');
  const debounced = useDebouncedValue(term.trim(), 350);

  React.useEffect(() => {
    if (debounced !== (values.q ?? '') && (debounced.length >= 2 || debounced === '')) set({ q: debounced || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const q = values.q ?? '';
  const type = values.type === 'collections' ? 'collections' : 'links';
  const params: SearchParams = {
    q,
    scope: (values.scope as SearchParams['scope']) || 'all',
    category: values.category || undefined,
    source_type: (values.source_type || undefined) as SourceType | undefined,
    sort: (values.sort as SearchParams['sort']) || 'relevance',
    page,
    per_page: 24,
  };
  const enabled = q.length >= 2;
  const links = useQuery({
    queryKey: queryKeys.search({ ...params, type: 'links' }),
    queryFn: ({ signal }) => searchApi.links(params, signal),
    enabled: enabled && type === 'links',
    placeholderData: (prev) => prev,
  });
  const collections = useQuery({
    queryKey: queryKeys.search({ q, type: 'collections', page }),
    queryFn: ({ signal }) => searchApi.collections({ q, page, per_page: 24 }, signal),
    enabled: enabled && type === 'collections',
  });
  const active = type === 'links' ? links : collections;

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          className="h-12 ps-11 text-base"
          maxLength={200}
          autoFocus
        />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SegmentedControl
          label={t('title')}
          value={type}
          onValueChange={(v) => set({ type: v === 'links' ? null : v })}
          options={[
            { value: 'links', label: t('links') },
            { value: 'collections', label: t('collections') },
          ]}
        />
        {type === 'links' && (
          <>
            <Select value={params.scope} onValueChange={(v) => set({ scope: v === 'all' ? null : v })}>
              <SelectTrigger className="w-40" aria-label={t('scope')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('scopes.all')}</SelectItem>
                <SelectItem value="own">{t('scopes.own')}</SelectItem>
                <SelectItem value="shared">{t('scopes.shared')}</SelectItem>
              </SelectContent>
            </Select>
            <CategorySelect
              value={values.category ?? ''}
              onChange={(c) => set({ category: c || null })}
              noneLabel={tf('anyCategory')}
              className="w-44"
              ariaLabel={tf('category')}
            />
            <Select value={values.source_type || ANY} onValueChange={(v) => set({ source_type: v === ANY ? null : v })}>
              <SelectTrigger className="w-40" aria-label={tf('sourceType')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{tf('anyType')}</SelectItem>
                {SOURCE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ts(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={params.sort} onValueChange={(v) => set({ sort: v === 'relevance' ? null : v })}>
              <SelectTrigger className="w-40" aria-label={tf('sort')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['relevance', 'latest', 'popular'] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {tf(`sorts.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {!enabled ? (
        <EmptyState icon={SearchIcon} title={t('startTitle')} description={t('startBody')} />
      ) : active.isError && !active.data ? (
        <ErrorState error={active.error} onRetry={() => active.refetch()} />
      ) : active.isPending ? (
        type === 'links' ? (
          <LinkGrid view="list" loading />
        ) : (
          <Skeleton className="h-40" />
        )
      ) : type === 'links' ? (
        links.data!.items.length === 0 ? (
          <EmptyState icon={SearchIcon} title={t('noResults')} description={t('noResultsBody')} />
        ) : (
          <div aria-live="polite">
            <p className="mb-3 text-sm text-muted-foreground">{t('resultCount', { count: links.data!.pagination.total ?? links.data!.items.length })}</p>
            <LinkGrid links={links.data!.items} view="list" />
            <PaginationBar pagination={links.data!.pagination} onPageChange={(p) => set({ page: p })} />
          </div>
        )
      ) : collections.data!.items.length === 0 ? (
        <EmptyState icon={FolderOpen} title={t('noResults')} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.data!.items.map((c) => (
            <li key={c.public_id}>
              <CollectionCard collection={c} href={`/dashboard/collections/${c.public_id}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
