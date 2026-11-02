'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { accountApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import type { User } from '@/lib/api/types';
import {
  deleteAccountSchema,
  emailChangeSchema,
  passwordChangeSchema,
  type DeleteAccountValues,
  type EmailChangeValues,
  type PasswordChangeValues,
} from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { useErrorMessage } from '@/hooks/use-error-message';

export function EmailForm({ user }: { user: User }) {
  const t = useTranslations('settings.email');
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const form = useForm<EmailChangeValues>({ resolver: zodResolver(emailChangeSchema), defaultValues: { email: user.email, current_password: '' } });

  async function onSubmit(values: EmailChangeValues) {
    try {
      const res = await accountApi.update({ email: values.email, current_password: values.current_password });
      queryClient.setQueryData(queryKeys.session, res.data);
      form.reset({ email: res.data.email, current_password: '' });
      toast.success(res.data.email_verified ? t('saved') : t('savedVerify'));
    } catch (error) {
      if (!applyServerErrors(error, form.setError, ['email', 'current_password'])) toast.error(errorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('title')}
          {user.email_verified ? <Badge variant="success">{t('verified')}</Badge> : <Badge variant="warning">{t('unverified')}</Badge>}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" dir="ltr" autoComplete="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('currentPassword')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="current-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
                {t('save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function PasswordForm() {
  const t = useTranslations('settings.password');
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  });

  async function onSubmit(values: PasswordChangeValues) {
    try {
      const res = await accountApi.updatePassword(values);
      form.reset();
      toast.success(res.message ?? t('saved'));
      queryClient.invalidateQueries({ queryKey: queryKeys.account.sessions });
    } catch (error) {
      if (!applyServerErrors(error, form.setError, ['current_password', 'password', 'password_confirmation'])) toast.error(errorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('current')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="current-password" />
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
                    <FormLabel>{t('new')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" />
                    </FormControl>
                    <FormDescription>{t('hint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirm')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={form.formState.isSubmitting}>
                {t('save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function DeleteAccountCard() {
  const t = useTranslations('settings.delete');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const form = useForm<DeleteAccountValues>({ resolver: zodResolver(deleteAccountSchema), defaultValues: { password: '', confirmation: '' as 'DELETE' } });

  async function onSubmit(values: DeleteAccountValues) {
    try {
      const res = await accountApi.deleteAccount(values);
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, null);
      toast.success(res.message ?? t('done'));
      router.replace('/');
    } catch (error) {
      if (!applyServerErrors(error, form.setError, ['password', 'confirmation'])) toast.error(errorMessage(error));
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          {t('button')}
        </Button>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) form.reset();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('confirmTitle')}</DialogTitle>
              <DialogDescription>{t('confirmBody')}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('password')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="current-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.rich('typeDelete', { code: (c) => <code className="rounded bg-muted px-1 font-mono">{c}</code> })}</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    {tc('cancel')}
                  </Button>
                  <Button type="submit" variant="destructive" loading={form.formState.isSubmitting}>
                    {t('confirm')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
