'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { inviteSchema, type InviteValues } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { isApiError } from '@/lib/api/errors';
import { useSharingMutations } from '@/hooks/use-sharing';
import { useErrorMessage } from '@/hooks/use-error-message';

/** POST /links/{id}/invitations — recipients must sign in with (and verify) the invited e-mail. */
export function InviteForm({ linkId, disabled = false }: { linkId: string; disabled?: boolean }) {
  const t = useTranslations('sharing.invite');
  const errorMessage = useErrorMessage();
  const { invite } = useSharingMutations(linkId);
  const form = useForm<InviteValues>({ resolver: zodResolver(inviteSchema), defaultValues: { email: '' } });

  async function onSubmit(values: InviteValues) {
    try {
      const res = await invite.mutateAsync(values.email);
      toast.success(res.message ?? t('sent'));
      form.reset();
    } catch (error) {
      if (isApiError(error) && error.status === 422 && !error.errors.email && error.code !== 'VALIDATION_ERROR') {
        form.setError('email', { type: 'server', message: errorMessage(error) });
        return;
      }
      if (isApiError(error) && error.status === 409) {
        form.setError('email', { type: 'server', message: errorMessage(error) });
        return;
      }
      if (!applyServerErrors(error, form.setError, ['email'])) toast.error(errorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 sm:flex-row sm:items-start" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="sr-only">{t('email')}</FormLabel>
              <FormControl>
                <Input {...field} type="email" dir="ltr" autoComplete="off" placeholder={t('placeholder')} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" loading={form.formState.isSubmitting} disabled={disabled}>
          <Send className="rtl-flip" aria-hidden /> {t('submit')}
        </Button>
      </form>
    </Form>
  );
}
