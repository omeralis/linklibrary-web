'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GuestOnly } from '@/components/layout/require-auth';
import { authApi } from '@/lib/api/endpoints';
import { isApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/query-keys';
import { loginSchema, type LoginValues } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { safeInternalPath, stripLocale } from '@/lib/url';
import { useErrorMessage } from '@/hooks/use-error-message';
import { AuthCard } from './auth-card';
import { PasswordInput } from './password-input';

export function LoginForm() {
  const t = useTranslations('auth.login');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const next = safeInternalPath(searchParams.get('next'), '/dashboard');
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '', remember: true } });

  async function onSubmit(values: LoginValues) {
    try {
      const res = await authApi.login(values);
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, res.data.user);
      toast.success(res.message ?? t('success'));
      // Continue in the account's saved language.
      router.replace(stripLocale(next), { locale: res.data.user.locale ?? locale });
    } catch (error) {
      if (isApiError(error) && error.code === 'RATE_LIMITED') {
        form.setError('root', { message: errorMessage(error) });
        return;
      }
      if (!applyServerErrors(error, form.setError, ['email', 'password'])) form.setError('root', { message: errorMessage(error) });
    }
  }

  return (
    <GuestOnly>
      <AuthCard
        title={t('title')}
        description={t('description')}
        footer={t.rich('noAccount', {
          link: (c) => (
            <Link
              href={searchParams.get('next') ? `/register?next=${encodeURIComponent(next)}` : '/register'}
              className="font-medium text-primary hover:underline"
            >
              {c}
            </Link>
          ),
        })}
      >
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t('password')}</FormLabel>
                    <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                      {t('forgot')}
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput {...field} autoComplete="current-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  </FormControl>
                  <FormLabel className="font-normal">{t('remember')}</FormLabel>
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
              {t('submit')}
            </Button>
          </form>
        </Form>
      </AuthCard>
    </GuestOnly>
  );
}
