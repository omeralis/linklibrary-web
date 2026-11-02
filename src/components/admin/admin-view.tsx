'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { PaginationBar } from '@/components/common/pagination-bar';
import { SecurityBadge } from '@/components/links/status-badges';
import { adminApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import type { AdminAppeal } from '@/lib/api/types';
import { formatDateTime } from '@/lib/format';
import { useSession } from '@/hooks/use-session';
import { useUrlState } from '@/hooks/use-url-state';
import { useErrorMessage } from '@/hooks/use-error-message';

/** Admin tools (backend `can:admin` gate is authoritative; non-admins get 403 from every call). */
export function AdminView() {
  const t = useTranslations('admin');
  const { user } = useSession();
  const { values, set } = useUrlState();
  const tab = values.tab ?? 'appeals';

  if (!user?.is_admin) return <EmptyState icon={ShieldCheck} title={t('forbiddenTitle')} description={t('forbiddenBody')} />;

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />
      <Tabs value={tab} onValueChange={(v) => set({ tab: v === 'appeals' ? null : v })}>
        <TabsList className="mb-4">
          <TabsTrigger value="appeals">{t('tabs.appeals')}</TabsTrigger>
          <TabsTrigger value="categories">{t('tabs.categories')}</TabsTrigger>
          <TabsTrigger value="audit">{t('tabs.audit')}</TabsTrigger>
        </TabsList>
        <TabsContent value="appeals">
          <Appeals />
        </TabsContent>
        <TabsContent value="categories">
          <Categories />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Appeals() {
  const t = useTranslations('admin.appeals');
  const locale = useLocale();
  const [status, setStatus] = React.useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [page, setPage] = React.useState(1);
  const [target, setTarget] = React.useState<AdminAppeal | null>(null);
  const list = useQuery({ queryKey: queryKeys.admin.appeals(status, page), queryFn: () => adminApi.appeals(status, page) });

  return (
    <div className="grid gap-4">
      <Select
        value={status}
        onValueChange={(v) => {
          setStatus(v as typeof status);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-44" aria-label={t('status')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
            <SelectItem key={s} value={s}>
              {t(`statuses.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {list.isPending ? (
        <Skeleton className="h-32" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : list.data.items.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={t('empty')} />
      ) : (
        <>
          <ul className="grid gap-2">
            {list.data.items.map((a) => (
              <li key={a.id}>
                <Card className="gap-2 py-4">
                  <CardContent className="grid gap-2 px-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm" dir="ltr">
                        {a.link.hostname}
                      </span>
                      <SecurityBadge status={a.link.security_status} showTooltip={false} />
                      <span className="ms-auto text-xs text-muted-foreground">{formatDateTime(a.created_at, locale)}</span>
                    </div>
                    <p className="font-mono text-xs break-all text-muted-foreground" dir="ltr">
                      {a.link.url}
                    </p>
                    <p className="text-sm whitespace-pre-line">{a.reason}</p>
                    <p className="text-xs text-muted-foreground">{t('by', { username: a.submitted_by.username })}</p>
                    {a.status === 'PENDING' ? (
                      <Button size="sm" className="justify-self-start" onClick={() => setTarget(a)}>
                        {t('review')}
                      </Button>
                    ) : (
                      <Badge variant={a.status === 'APPROVED' ? 'success' : 'danger'}>{t(`statuses.${a.status}`)}</Badge>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          <PaginationBar pagination={list.data.pagination} onPageChange={setPage} />
        </>
      )}
      <ResolveDialog appeal={target} onClose={() => setTarget(null)} />
    </div>
  );
}

function ResolveDialog({ appeal, onClose }: { appeal: AdminAppeal | null; onClose: () => void }) {
  const t = useTranslations('admin.appeals');
  const tc = useTranslations('common');
  const tsec = useTranslations('security.status');
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [decision, setDecision] = React.useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [verdict, setVerdict] = React.useState<'CLEAR' | 'SUSPICIOUS'>('CLEAR');
  const [notes, setNotes] = React.useState('');
  const resolve = useMutation({
    mutationFn: () => adminApi.resolveAppeal(appeal!.id, { decision, verdict: decision === 'APPROVE' ? verdict : undefined, notes: notes || null }),
    onSuccess: (r) => {
      toast.success(r.message ?? t('resolved'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'appeals'] });
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={!!appeal} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('resolveTitle')}</DialogTitle>
          <DialogDescription dir="ltr" className="font-mono text-xs break-all">
            {appeal?.link.url}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t('decision')}</Label>
            <Select value={decision} onValueChange={(v) => setDecision(v as typeof decision)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVE">{t('approve')}</SelectItem>
                <SelectItem value="REJECT">{t('reject')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {decision === 'APPROVE' && (
            <div className="grid gap-2">
              <Label>{t('verdict')}</Label>
              <Select value={verdict} onValueChange={(v) => setVerdict(v as typeof verdict)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLEAR">{tsec('CLEAR')}</SelectItem>
                  <SelectItem value="SUSPICIOUS">{tsec('SUSPICIOUS')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="appeal-notes">{t('notes')}</Label>
            <Textarea id="appeal-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tc('cancel')}
          </Button>
          <Button onClick={() => resolve.mutate()} loading={resolve.isPending}>
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Categories() {
  const t = useTranslations('admin.categories');
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: queryKeys.admin.categories, queryFn: () => adminApi.categories() });
  const [form, setForm] = React.useState({ slug: '', name_ar: '', name_en: '' });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.categories });
  };
  const create = useMutation({
    mutationFn: () => adminApi.createCategory(form),
    onSuccess: (r) => {
      toast.success(r.message ?? t('created'));
      setForm({ slug: '', name_ar: '', name_en: '' });
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: async ({ slug, active }: { slug: string; active: boolean }): Promise<void> => {
      if (active) await adminApi.updateCategory(slug, { is_active: true });
      else await adminApi.deactivateCategory(slug);
    },
    onSuccess: () => refresh(),
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="grid gap-4">
      <form
        className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="cat-slug">{t('slug')}</Label>
          <Input
            id="cat-slug"
            dir="ltr"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
            maxLength={80}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cat-ar">{t('nameAr')}</Label>
          <Input
            id="cat-ar"
            dir="rtl"
            lang="ar"
            value={form.name_ar}
            onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
            required
            maxLength={120}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cat-en">{t('nameEn')}</Label>
          <Input
            id="cat-en"
            dir="ltr"
            lang="en"
            value={form.name_en}
            onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            required
            maxLength={120}
          />
        </div>
        <Button type="submit" loading={create.isPending}>
          {t('create')}
        </Button>
      </form>
      {list.isPending ? (
        <Skeleton className="h-40" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-start font-medium">{t('slug')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('nameAr')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('nameEn')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('status')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {list.data.map((c) => (
                <tr key={c.slug} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs" dir="ltr">
                    {c.slug}
                  </td>
                  <td className="px-4 py-2" lang="ar">
                    {c.name_ar}
                  </td>
                  <td className="px-4 py-2" lang="en">
                    {c.name_en}
                  </td>
                  <td className="px-4 py-2">
                    {c.is_active === false ? <Badge variant="muted">{t('inactive')}</Badge> : <Badge variant="success">{t('active')}</Badge>}
                  </td>
                  <td className="px-4 py-2 text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggle.mutate({ slug: c.slug, active: c.is_active === false })}
                      disabled={toggle.isPending}
                    >
                      {c.is_active === false ? t('activate') : t('deactivate')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AuditLog() {
  const t = useTranslations('admin.audit');
  const locale = useLocale();
  const [page, setPage] = React.useState(1);
  const [action, setAction] = React.useState('');
  const list = useQuery({
    queryKey: queryKeys.admin.audit({ page, action }),
    queryFn: () => adminApi.auditLogs({ page, action: action || undefined }),
    placeholderData: (p) => p,
  });

  return (
    <div className="grid gap-4">
      <Input
        className="max-w-xs"
        dir="ltr"
        placeholder={t('filterAction')}
        aria-label={t('filterAction')}
        value={action}
        onChange={(e) => {
          setAction(e.target.value.trim());
          setPage(1);
        }}
      />
      {list.isPending ? (
        <Skeleton className="h-40" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : list.data.items.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={t('empty')} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start font-medium">{t('when')}</th>
                  <th className="px-4 py-2 text-start font-medium">{t('action')}</th>
                  <th className="px-4 py-2 text-start font-medium">{t('actor')}</th>
                  <th className="px-4 py-2 text-start font-medium">{t('target')}</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(log.created_at, locale)}</td>
                    <td className="px-4 py-2 font-mono text-xs" dir="ltr">
                      {log.action}
                    </td>
                    <td className="px-4 py-2" dir="ltr">
                      {log.actor ?? '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs" dir="ltr">
                      {log.target_type ? `${log.target_type}:${log.target_id ?? ''}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar pagination={list.data.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
