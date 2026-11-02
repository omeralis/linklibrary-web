'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Info, RefreshCw, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/common/error-state';
import type { OwnedLink } from '@/lib/api/types';
import { formatDateTime } from '@/lib/format';
import { appealSchema, type AppealValues } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { useSecurityActions, useSecurityDetails } from '@/hooks/use-links';
import { useErrorMessage } from '@/hooks/use-error-message';
import { SecurityBadge } from './status-badges';

function Capability({ ok, label }: { ok: boolean; label: string }) {
  const t = useTranslations('security.details');
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span>{label}</span>
      <span className={ok ? 'flex items-center gap-1 text-success-foreground' : 'flex items-center gap-1 text-muted-foreground'}>
        {ok ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
        {ok ? t('allowed') : t('notAllowed')}
      </span>
    </li>
  );
}

/** Owner-only security details (GET /links/{id}/security), rescan (10/hour) and review requests (appeals). */
export function SecurityPanel({ link }: { link: OwnedLink }) {
  const t = useTranslations('security.details');
  const tsec = useTranslations('security');
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const details = useSecurityDetails(link.public_id);
  const { rescan, appeal } = useSecurityActions(link.public_id);
  const form = useForm<AppealValues>({ resolver: zodResolver(appealSchema), defaultValues: { reason: '' } });

  if (details.isPending) return <Skeleton className="h-72" />;
  if (details.isError) return <ErrorState error={details.error} onRetry={() => details.refetch()} />;

  const d = details.data;
  const pendingAppeal = d.appeals.some((a) => a.status === 'PENDING');
  const canAppeal = (d.stored_status === 'SUSPICIOUS' || d.stored_status === 'MALICIOUS') && !pendingAppeal;

  async function submitAppeal(values: AppealValues) {
    try {
      const res = await appeal.mutateAsync(values.reason);
      toast.success(res.message ?? t('appealSent'));
      form.reset();
    } catch (error) {
      if (!applyServerErrors(error, form.setError, ['reason'])) toast.error(errorMessage(error));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {t('title')} <SecurityBadge status={d.status} showTooltip={false} />
            </CardTitle>
            <CardDescription>{tsec(`explain.${d.status}`)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t('source')}</dt>
                <dd className="font-medium">{t(`sources.${d.source}`)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('checkedAt')}</dt>
                <dd className="font-medium">{d.checked_at ? formatDateTime(d.checked_at, locale) : t('never')}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('expiresAt')}</dt>
                <dd className="font-medium">{d.expires_at ? formatDateTime(d.expires_at, locale) : '—'}</dd>
              </div>
              {d.stored_status !== d.status && (
                <div>
                  <dt className="text-muted-foreground">{t('storedStatus')}</dt>
                  <dd>
                    <SecurityBadge status={d.stored_status} showTooltip={false} />
                  </dd>
                </div>
              )}
            </dl>
            <Alert variant="info">
              <Info aria-hidden />
              <AlertDescription>{d.disclaimer}</AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                loading={rescan.isPending}
                onClick={() =>
                  rescan.mutate(undefined, { onSuccess: (r) => toast.success(r.message ?? t('rescanQueued')), onError: (e) => toast.error(errorMessage(e)) })
                }
              >
                <RefreshCw aria-hidden /> {t('rescan')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {(canAppeal || d.appeals.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('appealTitle')}</CardTitle>
              <CardDescription>{t('appealDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {d.appeals.length > 0 && (
                <ul className="grid gap-2">
                  {d.appeals.map((a) => (
                    <li key={a.id} className="rounded-lg border p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <Badge variant={a.status === 'PENDING' ? 'info' : a.status === 'APPROVED' ? 'success' : 'danger'}>
                          {t(`appealStatus.${a.status}`)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(a.created_at, locale)}</span>
                      </div>
                      <p className="whitespace-pre-line">{a.reason}</p>
                      {a.reviewer_notes && <p className="mt-2 text-muted-foreground">{t('reviewerNotes', { notes: a.reviewer_notes })}</p>}
                    </li>
                  ))}
                </ul>
              )}
              {canAppeal && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(submitAppeal)} className="grid gap-3" noValidate>
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('appealReason')}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} maxLength={2000} />
                          </FormControl>
                          <FormDescription>{t('appealHint')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="justify-self-start" loading={form.formState.isSubmitting}>
                      {t('appealSubmit')}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('historyTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {d.history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('historyEmpty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-start text-xs text-muted-foreground">
                      <th className="py-2 text-start font-medium">{t('colDate')}</th>
                      <th className="py-2 text-start font-medium">{t('colTrigger')}</th>
                      <th className="py-2 text-start font-medium">{t('colResult')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.history.map((scan, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pe-3 whitespace-nowrap">{formatDateTime(scan.created_at, locale)}</td>
                        <td className="py-2 pe-3 font-mono text-xs">{scan.trigger}</td>
                        <td className="py-2">
                          {scan.verdict ? (
                            <SecurityBadge status={scan.verdict} showTooltip={false} />
                          ) : (
                            <span className="text-muted-foreground">{scan.status}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">{t('capabilities')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2">
            <Capability ok={d.can_open} label={t('canOpen')} />
            <Capability ok={d.can_publish} label={t('canPublish')} />
            <Capability ok={d.can_share} label={t('canShare')} />
          </ul>
          {(!d.can_publish || !d.can_share) && (
            <Alert variant="warning" className="mt-4">
              <AlertTitle>{t('restrictedTitle')}</AlertTitle>
              <AlertDescription>{tsec(`restrictionReason.${d.status}`)}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
