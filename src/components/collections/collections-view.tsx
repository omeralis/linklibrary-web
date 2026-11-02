'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { useRouter } from '@/i18n/navigation';
import { searchApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { useCollections } from '@/hooks/use-collections';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlState } from '@/hooks/use-url-state';
import { CollectionCard } from './collection-card';
import { CollectionFormDialog } from './collection-form-dialog';

export function CollectionsView() {
  const t = useTranslations('collections');
  const router = useRouter();
  const { values, set } = useUrlState();
  const [term, setTerm] = React.useState('');
  const q = useDebouncedValue(term.trim(), 300);
  const list = useCollections();
  const searching = q.length >= 2;
  const results = useQuery({
    queryKey: queryKeys.search({ q, type: 'collections', per_page: 50 }),
    queryFn: ({ signal }) => searchApi.collections({ q, per_page: 50 }, signal),
    enabled: searching,
  });
  const createOpen = values.new === '1';
  const source = searching ? results : list;

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button onClick={() => set({ new: '1' })}>
            <Plus aria-hidden /> {t('new')}
          </Button>
        }
      />
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="ps-9"
        />
      </div>
      {source.isError ? (
        <ErrorState error={source.error} onRetry={() => source.refetch()} />
      ) : source.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : source.data.items.length === 0 ? (
        searching ? (
          <EmptyState icon={Search} title={t('noResults')} />
        ) : (
          <EmptyState
            icon={FolderOpen}
            title={t('emptyTitle')}
            description={t('emptyBody')}
            action={
              <Button onClick={() => set({ new: '1' })}>
                <Plus aria-hidden /> {t('new')}
              </Button>
            }
          />
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {source.data.items.map((c) => (
            <li key={c.public_id}>
              <CollectionCard collection={c} href={`/dashboard/collections/${c.public_id}`} />
            </li>
          ))}
        </ul>
      )}
      <CollectionFormDialog
        open={createOpen}
        onOpenChange={(open) => !open && set({ new: null })}
        onCreated={(c) => router.push(`/dashboard/collections/${c.public_id}`)}
      />
    </div>
  );
}
