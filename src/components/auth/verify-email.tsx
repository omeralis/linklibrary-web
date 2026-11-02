'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { useSession } from '@/hooks/use-session';
import { useErrorMessage } from '@/hooks/use-error-message';
import { AuthCard } from './auth-card';

type State = { kind: 'verifying' } | { kind: 'success'; message: string } | { kind: 'error'; message: string } | { kind: 'missing' };

/** /verify-email?id&hash&expires&signature — works signed in or out (handoff §2.3). */
export function VerifyEmail() {
  const t = useTranslations('auth.verify');
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const { user } = useSession();
  const params = {
    id: searchParams.get('id') ?? '',
    hash: searchParams.get('hash') ?? '',
    expires: searchParams.get('expires') ?? '',
    signature: searchParams.get('signature') ?? '',
  };
  const complete = !!(params.id && params.hash && params.expires && params.signature);
  const [state, setState] = React.useState<State>(complete ? { kind: 'verifying' } : { kind: 'missing' });
  const started = React.useRef(false);

  React.useEffect(() => {
    if (!complete || started.current) return;
    started.current = true;
    authApi
      .verifyEmail(params)
      .then((res) => {
        setState({ kind: 'success', message: res.message ?? t('success') });
        queryClient.invalidateQueries({ queryKey: queryKeys.session });
      })
      .catch((error) => setState({ kind: 'error', message: errorMessage(error) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const resend = useMutation({
    mutationFn: () => authApi.resendVerification(),
    onSuccess: (res) => toast.success(res.message ?? t('resent')),
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (state.kind === 'verifying') {
    return (
      <AuthCard title={t('verifyingTitle')}>
        <div className="flex justify-center py-4" role="status" aria-live="polite">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
          <span className="sr-only">{t('verifyingTitle')}</span>
        </div>
      </AuthCard>
    );
  }

  if (state.kind === 'success') {
    return (
      <AuthCard title={t('successTitle')}>
        <div className="flex flex-col items-center gap-4 text-center" role="status">
          <CheckCircle2 className="size-12 text-success" aria-hidden />
          <p className="text-sm">{state.message}</p>
          <Button asChild className="w-full">
            <Link href={user ? '/dashboard' : '/login'}>{user ? t('toDashboard') : t('toLogin')}</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={state.kind === 'missing' ? t('missingTitle') : t('errorTitle')}>
      <div className="flex flex-col items-center gap-4 text-center" role="alert">
        <XCircle className="size-12 text-destructive" aria-hidden />
        <p className="text-sm">{state.kind === 'missing' ? t('missingBody') : state.message}</p>
        {user && !user.email_verified ? (
          <Button className="w-full" onClick={() => resend.mutate()} loading={resend.isPending}>
            {t('resend')}
          </Button>
        ) : user ? (
          <Button asChild className="w-full">
            <Link href="/dashboard">{t('toDashboard')}</Link>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href="/login?next=/dashboard">{t('loginToResend')}</Link>
          </Button>
        )}
      </div>
    </AuthCard>
  );
}
