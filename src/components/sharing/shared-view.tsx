'use client';

import { Check, Mail, MailWarning, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { PaginationBar } from '@/components/common/pagination-bar';
import { LinkFilters, useViewPreference, type FilterState } from '@/components/links/link-filters';
import { LinkGrid } from '@/components/links/link-card';
import type { LinkSort, SourceType } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { useAcceptInvitation, useReceivedInvitations, useSharedWithMe } from '@/hooks/use-sharing';
import { useUrlState } from '@/hooks/use-url-state';
import { useErrorMessage } from '@/hooks/use-error-message';

const SORTS = ['latest', 'oldest', 'title', 'popular', 'relevance'] as const;

export function SharedView() {
  const t = useTranslations('sharing.shared');
  const { values, set, page } = useUrlState();
  const tab = values.tab === 'invitations' ? 'invitations' : 'links';
  const invitations = useReceivedInvitations();
  const pending = invitations.data?.items.length ?? 0;

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />
      <Tabs value={tab} onValueChange={(v) => set({ tab: v === 'links' ? null : v })}>
        <TabsList className="mb-4">
          <TabsTrigger value="links">
            <Users aria-hidden /> {t('tabLinks')}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail aria-hidden /> {t('tabInvitations')}
            {pending > 0 && (
              <Badge variant="brand" className="px-1.5">
                {pending}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="links">
          <SharedLinks values={values} set={set} page={page} />
        </TabsContent>
        <TabsContent value="invitations">
          <ReceivedInvitations />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SharedLinks({ values, set, page }: ReturnType<typeof useUrlState>) {
  const t = useTranslations('sharing.shared');
  const [view, setView] = useViewPreference();
  const filters: FilterState = {
    q: values.q ?? '',
    category: values.category ?? '',
    tag: values.tag ?? '',
    source_type: values.source_type ?? '',
    visibility: '',
    security_status: '',
    sort: values.sort ?? '',
  };
  const list = useSharedWithMe({
    q: filters.q || undefined,
    category: filters.category || undefined,
    tag: filters.tag || undefined,
    source_type: (filters.source_type || undefined) as SourceType | undefined,
    sort: (filters.sort || (filters.q ? 'relevance' : 'latest')) as LinkSort,
    page,
    per_page: 24,
  });
  return (
    <>
      <LinkFilters values={filters} onChange={(p) => set(p)} view={view} onViewChange={setView} options={{ sorts: SORTS }} />
      {list.isError && !list.data ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : list.isPending ? (
        <LinkGrid view={view} loading />
      ) : list.data.items.length === 0 ? (
        <EmptyState icon={Users} title={t('emptyTitle')} description={t('emptyBody')} />
      ) : (
        <>
          <LinkGrid links={list.data.items} view={view} />
          <PaginationBar pagination={list.data.pagination} onPageChange={(p) => set({ page: p })} />
        </>
      )}
    </>
  );
}

function ReceivedInvitations() {
  const t = useTranslations('sharing.received');
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const list = useReceivedInvitations();
  const accept = useAcceptInvitation();

  if (list.isPending) return <Skeleton className="h-32" />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;
  if (list.data.meta.email_verified === false) {
    return <EmptyState icon={MailWarning} title={t('verifyTitle')} description={t('verifyBody')} />;
  }
  if (list.data.items.length === 0) return <EmptyState icon={Mail} title={t('emptyTitle')} description={t('emptyBody')} />;

  return (
    <ul className="grid gap-2">
      {list.data.items.map((inv) => (
        <li key={inv.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{t('from', { name: inv.invited_by.name })}</p>
            <p className="text-sm text-muted-foreground">
              {t('meta', { date: formatDate(inv.created_at, locale), expires: formatDate(inv.expires_at, locale) })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t('privacy')}</p>
          </div>
          <Button
            loading={accept.isPending && accept.variables === inv.id}
            onClick={() =>
              accept.mutate(inv.id, {
                onSuccess: (res) => {
                  toast.success(res.message ?? t('accepted'));
                  router.push(`/l/${res.data.public_id}`);
                },
                onError: (e) => toast.error(errorMessage(e)),
              })
            }
          >
            <Check aria-hidden /> {t('accept')}
          </Button>
        </li>
      ))}
    </ul>
  );
}
