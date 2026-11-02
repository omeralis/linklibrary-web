'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Laptop, LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { accountApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { formatDateTime, formatRelative } from '@/lib/format';
import { useErrorMessage } from '@/hooks/use-error-message';

/** Very small UA summary for display only (never used for security decisions). */
function describeAgent(ua: string | null): string {
  if (!ua) return '—';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : null;
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS X/.test(ua)
      ? 'macOS'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : null;
  return [browser, os].filter(Boolean).join(' · ') || ua.slice(0, 60);
}

export function SessionsCard() {
  const t = useTranslations('settings.sessions');
  const tc = useTranslations('common');
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const sessions = useQuery({ queryKey: queryKeys.account.sessions, queryFn: () => accountApi.sessions() });
  const revoke = useMutation({
    mutationFn: (id: string) => accountApi.revokeSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.account.sessions }),
  });
  const [othersOpen, setOthersOpen] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const revokeOthers = useMutation({
    mutationFn: () => accountApi.revokeOtherSessions(password),
    onSuccess: (r) => {
      toast.success(r.message ?? t('revoked'));
      setOthersOpen(false);
      setPassword('');
      queryClient.invalidateQueries({ queryKey: queryKeys.account.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.account.tokens });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {sessions.isPending ? (
          <Skeleton className="h-24" />
        ) : sessions.isError ? (
          <ErrorState error={sessions.error} onRetry={() => sessions.refetch()} compact />
        ) : sessions.data.meta?.supported === false ? (
          <p className="text-sm text-muted-foreground">{t('unsupported')}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {sessions.data.data.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <Laptop className="size-5 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {describeAgent(s.user_agent)} {s.current && <Badge variant="success">{t('current')}</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span dir="ltr">{s.ip_address ?? '—'}</span> ·{' '}
                    <span title={formatDateTime(s.last_active_at, locale)}>{formatRelative(s.last_active_at, locale)}</span>
                  </p>
                </div>
                {!s.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={revoke.isPending && revoke.variables === s.id}
                    onClick={() => revoke.mutate(s.id, { onSuccess: () => toast.success(t('revoked')), onError: (e) => toast.error(errorMessage(e)) })}
                  >
                    <LogOut className="rtl-flip" aria-hidden /> {t('revoke')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" className="justify-self-start" onClick={() => setOthersOpen(true)}>
          {t('revokeOthers')}
        </Button>
        <Dialog open={othersOpen} onOpenChange={setOthersOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('revokeOthersTitle')}</DialogTitle>
              <DialogDescription>{t('revokeOthersBody')}</DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                revokeOthers.mutate();
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="revoke-password">{t('password')}</Label>
                <Input id="revoke-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOthersOpen(false)}>
                  {tc('cancel')}
                </Button>
                <Button type="submit" variant="destructive" loading={revokeOthers.isPending} disabled={!password}>
                  {t('revokeOthers')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export function TokensCard() {
  const t = useTranslations('settings.tokens');
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const tokens = useQuery({ queryKey: queryKeys.account.tokens, queryFn: () => accountApi.tokens() });
  const revoke = useMutation({
    mutationFn: (id: number) => accountApi.revokeToken(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.account.tokens }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {tokens.isPending ? (
          <Skeleton className="h-16" />
        ) : tokens.isError ? (
          <ErrorState error={tokens.error} onRetry={() => tokens.refetch()} compact />
        ) : tokens.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {tokens.data.map((tok) => (
              <li key={tok.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <KeyRound className="size-5 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tok.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('lastUsed', { when: tok.last_used_at ? formatRelative(tok.last_used_at, locale) : t('never') })}
                    {tok.expires_at && ` · ${t('expires', { date: formatDateTime(tok.expires_at, locale) })}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  loading={revoke.isPending && revoke.variables === tok.id}
                  onClick={() => revoke.mutate(tok.id, { onSuccess: () => toast.success(t('revoked')), onError: (e) => toast.error(errorMessage(e)) })}
                >
                  {t('revoke')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
