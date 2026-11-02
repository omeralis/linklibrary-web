'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GuestOnly } from '@/components/layout/require-auth';
import { authApi } from '@/lib/api/endpoints';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { useErrorMessage } from '@/hooks/use-error-message';
import { AuthCard } from './auth-card';

/** The API always answers 202 with the same message (no account enumeration) — so does this page. */
export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgot');
  const errorMessage = useErrorMessage();
  const [sent, setSent] = React.useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      const res = await authApi.forgotPassword(values.email);
      setSent(res.message ?? t('sent'));
    } catch (error) {
      if (!applyServerErrors(error, form.setError, ['email'])) form.setError('root', { message: errorMessage(error) });
    }
  }

  return (
    <GuestOnly>
      <AuthCard
        title={t('title')}
        description={sent ? undefined : t('description')}
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t('back')}
          </Link>
        }
      >
        {sent ? (
          <div className="flex flex-col items-center gap-3 text-center" role="status">
            <div className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success-foreground">
              <MailCheck className="size-6" aria-hidden />
            </div>
            <p className="text-sm">{sent}</p>
            <p className="text-xs text-muted-foreground">{t('checkSpam')}</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
              {form.formState.errors.root && (
                <p role="alert" className="rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" autoComplete="email" dir="ltr" autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
                {t('submit')}
              </Button>
            </form>
          </Form>
        )}
      </AuthCard>
    </GuestOnly>
  );
}
