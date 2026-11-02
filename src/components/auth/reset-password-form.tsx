'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api/endpoints';
import { isApiError } from '@/lib/api/errors';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { useErrorMessage } from '@/hooks/use-error-message';
import { AuthCard } from './auth-card';
import { PasswordInput } from './password-input';

/** Opened from the e-mail link /reset-password?token&email (built by the backend from FRONTEND_URL). */
export function ResetPasswordForm() {
  const t = useTranslations('auth.reset');
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = useErrorMessage();
  const token = searchParams.get('token') ?? '';
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: searchParams.get('email') ?? '', password: '', password_confirmation: '' },
  });

  if (!token) {
    return (
      <AuthCard title={t('invalidTitle')} description={t('invalidBody')}>
        <Button asChild className="w-full">
          <Link href="/forgot-password">{t('requestNew')}</Link>
        </Button>
      </AuthCard>
    );
  }

  async function onSubmit(values: ResetPasswordValues) {
    try {
      const res = await authApi.resetPassword({ ...values, token });
      toast.success(res.message ?? t('success'));
      router.replace('/login');
    } catch (error) {
      if (isApiError(error) && error.code === 'INVALID_RESET_TOKEN') {
        form.setError('root', { message: errorMessage(error) });
        return;
      }
      if (!applyServerErrors(error, form.setError, ['email', 'password', 'password_confirmation'])) form.setError('root', { message: errorMessage(error) });
    }
  }

  return (
    <AuthCard title={t('title')} description={t('description')}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          {form.formState.errors.root && (
            <div role="alert" className="rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">
              {form.formState.errors.root.message}{' '}
              <Link href="/forgot-password" className="font-medium underline">
                {t('requestNew')}
              </Link>
            </div>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('email')}</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('password')}</FormLabel>
                <FormControl>
                  <PasswordInput {...field} autoComplete="new-password" autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password_confirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('passwordConfirm')}</FormLabel>
                <FormControl>
                  <PasswordInput {...field} autoComplete="new-password" />
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
    </AuthCard>
  );
}
