'use client';

import { MailWarning } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/endpoints';
import type { User } from '@/lib/api/types';
import { useErrorMessage } from '@/hooks/use-error-message';

/** Shown while `user.email_verified === false` (publishing, public collections and invitations need it). */
export function VerifyEmailBanner({ user }: { user: User }) {
  const t = useTranslations('auth.verifyBanner');
  const errorMessage = useErrorMessage();
  const resend = useMutation({
    mutationFn: () => authApi.resendVerification(),
    onSuccess: (res) => toast.success(res.message ?? t('sent')),
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (user.email_verified) return null;
  return (
    <div role="status" className="border-b bg-warning-soft text-warning-foreground">
      <div className="flex flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:px-6">
        <MailWarning className="hidden size-4 shrink-0 sm:block" aria-hidden />
        <p className="flex-1">{t.rich('message', { email: user.email, b: (chunks) => <strong dir="ltr">{chunks}</strong> })}</p>
        <Button size="sm" variant="outline" className="self-start bg-card/70 sm:self-auto" onClick={() => resend.mutate()} loading={resend.isPending}>
          {t('resend')}
        </Button>
      </div>
    </div>
  );
}
