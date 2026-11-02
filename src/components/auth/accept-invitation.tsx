'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Loader2, MailOpen, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { authApi, sharingApi } from '@/lib/api/endpoints';
import { isApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/query-keys';
import { useSession } from '@/hooks/use-session';
import { useErrorMessage } from '@/hooks/use-error-message';
import { AuthCard } from './auth-card';

/**
 * /invitations/accept?token=… (link from the invitation e-mail). The recipient must be signed in with the
 * invited, verified e-mail; acceptance is an explicit click (never automatic). The token is only sent to
 * POST /invitations/{token}/accept and is never stored.
 */
export function AcceptInvitation() {
  const t = useTranslations('sharing.accept');
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const { user, status } = useSession();
  const token = searchParams.get('token') ?? '';
  const nextPath = `/invitations/accept?token=${encodeURIComponent(token)}`;
  const [error, setError] = React.useState<{ message: string; code: string } | null>(null);

  const accept = useMutation({
    mutationFn: () => sharingApi.acceptByToken(token),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharing.all });
      toast.success(res.message ?? t('accepted'));
      router.replace(`/l/${res.data.public_id}`);
    },
    onError: (e) => setError({ message: errorMessage(e), code: isApiError(e) ? e.code : 'UNKNOWN' }),
  });
  const resend = useMutation({
    mutationFn: () => authApi.resendVerification(),
    onSuccess: (r) => toast.success(r.message ?? t('verificationSent')),
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!token) {
    return (
      <AuthCard title={t('invalidTitle')} description={t('invalidBody')}>
        <Button asChild className="w-full">
          <Link href="/">{t('home')}</Link>
        </Button>
      </AuthCard>
    );
  }

  if (status === 'loading') {
    return (
      <AuthCard title={t('title')}>
        <div className="flex justify-center py-4" role="status">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        </div>
      </AuthCard>
    );
  }

  if (!user) {
    return (
      <AuthCard title={t('title')} description={t('guestBody')}>
        <div className="grid gap-2">
          <Button asChild size="lg">
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>{t('signIn')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/register?next=${encodeURIComponent(nextPath)}`}>{t('createAccount')}</Link>
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t('sameEmailHint')}</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('title')} description={t('signedInAs', { email: user.email })}>
      <div className="grid gap-4">
        <div className="flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
            <MailOpen className="size-6" aria-hidden />
          </div>
        </div>
        {!user.email_verified && (
          <Alert variant="warning">
            <AlertDescription>
              <p>{t('verifyFirst')}</p>
              <Button size="sm" variant="outline" className="mt-2 bg-card/70" onClick={() => resend.mutate()} loading={resend.isPending}>
                {t('resendVerification')}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <p>{error.message}</p>
              {(error.code === 'INVITATION_NOT_FOUND' || error.code === 'NOT_FOUND') && <p className="mt-1 text-xs">{t('wrongAccountHint')}</p>}
            </AlertDescription>
          </Alert>
        )}
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('readOnlyNote')}
        </p>
        <Button size="lg" onClick={() => accept.mutate()} loading={accept.isPending} disabled={!user.email_verified}>
          {t('accept')}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/dashboard">{t('later')}</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
