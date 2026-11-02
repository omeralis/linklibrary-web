'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/layout/user-avatar';
import { accountApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import type { User } from '@/lib/api/types';
import { profileSchema, type ProfileValues } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { useErrorMessage } from '@/hooks/use-error-message';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ProfileForm({ user }: { user: User }) {
  const t = useTranslations('settings.profile');
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const defaults = React.useCallback(
    (u: User): ProfileValues => ({ name: u.name, username: u.username, bio: u.bio ?? '', profile_public: u.profile_public }),
    [],
  );
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: defaults(user) });
  const setUser = (u: User) => queryClient.setQueryData(queryKeys.session, u);

  const avatarUpload = useMutation({ mutationFn: (file: File) => accountApi.uploadAvatar(file), onSuccess: (r) => setUser(r.data) });
  const avatarDelete = useMutation({ mutationFn: () => accountApi.deleteAvatar(), onSuccess: (r) => setUser(r.data) });

  async function onSubmit(values: ProfileValues) {
    try {
      const res = await accountApi.update({
        name: values.name.trim(),
        username: values.username,
        bio: values.bio.trim() || null,
        profile_public: values.profile_public,
      });
      setUser(res.data);
      form.reset(defaults(res.data));
      toast.success(res.message ?? t('saved'));
    } catch (error) {
      if (!applyServerErrors(error, form.setError, ['name', 'username', 'bio', 'profile_public'])) toast.error(errorMessage(error));
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return void toast.error(t('avatarType'));
    if (file.size > 2 * 1024 * 1024) return void toast.error(t('avatarSize'));
    avatarUpload.mutate(file, { onSuccess: () => toast.success(t('avatarUpdated')), onError: (err) => toast.error(errorMessage(err)) });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar name={user.name} src={user.avatar_url} className="size-16 text-lg" />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_TYPES.join(',')}
              className="sr-only"
              onChange={onFile}
              tabIndex={-1}
              aria-label={t('uploadAvatar')}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} loading={avatarUpload.isPending}>
              <Camera aria-hidden /> {t('uploadAvatar')}
            </Button>
            {user.avatar_url && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                loading={avatarDelete.isPending}
                onClick={() =>
                  avatarDelete.mutate(undefined, { onSuccess: () => toast.success(t('avatarRemoved')), onError: (err) => toast.error(errorMessage(err)) })
                }
              >
                <Trash2 aria-hidden /> {t('removeAvatar')}
              </Button>
            )}
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('name')}</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="name" maxLength={100} />
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
                      <Input {...field} dir="ltr" autoComplete="username" maxLength={30} onChange={(e) => field.onChange(e.target.value.toLowerCase())} />
                    </FormControl>
                    <FormDescription>{t('usernameHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bio')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} maxLength={500} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profile_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start justify-between gap-4 rounded-lg border p-4">
                  <div className="grid gap-1">
                    <FormLabel>{t('publicProfile')}</FormLabel>
                    <FormDescription>
                      {t('publicProfileHint')}{' '}
                      {user.profile_public && (
                        <Link href={`/u/${user.username}`} className="text-primary underline underline-offset-4">
                          {t('viewProfile')}
                        </Link>
                      )}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
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
