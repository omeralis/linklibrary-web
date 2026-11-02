'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GuestOnly } from '@/components/layout/require-auth';
import { authApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import type { Locale } from '@/lib/api/types';
import { registerSchema, type RegisterValues } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { safeInternalPath, stripLocale } from '@/lib/url';
import { useErrorMessage } from '@/hooks/use-error-message';
import { AuthCard } from './auth-card';
import { PasswordInput } from './password-input';

const FIELDS = ['name', 'username', 'email', 'password', 'password_confirmation'] as const;

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const next = safeInternalPath(searchParams.get('next'), '/dashboard');
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', username: '', email: searchParams.get('email') ?? '', password: '', password_confirmation: '' },
  });

  async function onSubmit(values: RegisterValues) {
    try {
      const res = await authApi.register({ ...values, locale });
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, res.data.user);
      toast.success(res.message ?? t('success'));
      router.replace(stripLocale(next));
    } catch (error) {
      if (!applyServerErrors(error, form.setError, FIELDS)) form.setError('root', { message: errorMessage(error) });
    }
  }

  return (
    <GuestOnly>
      <AuthCard
        title={t('title')}
        description={t('description')}
        footer={t.rich('haveAccount', {
          link: (c) => (
            <Link href={searchParams.get('next') ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="font-medium text-primary hover:underline">
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="name" maxLength={100} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('username')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="username" dir="ltr" maxLength={30} onChange={(e) => field.onChange(e.target.value.toLowerCase())} />
                  </FormControl>
                  <FormDescription>{t('usernameHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password')}</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} autoComplete="new-password" />
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
            </div>
            <p className="text-xs text-muted-foreground">{t('passwordHint')}</p>
            <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
              {t('submit')}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t.rich('legal', {
                terms: (c) => (
                  <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                    {c}
                  </Link>
                ),
                privacy: (c) => (
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                    {c}
                  </Link>
                ),
              })}
            </p>
          </form>
        </Form>
      </AuthCard>
    </GuestOnly>
  );
}
