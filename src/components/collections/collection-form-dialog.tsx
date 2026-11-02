'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { Collection } from '@/lib/api/types';
import { collectionSchema, type CollectionValues } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { useCreateCollection, useUpdateCollection } from '@/hooks/use-collections';
import { useErrorMessage } from '@/hooks/use-error-message';
import { useSession } from '@/hooks/use-session';

export function CollectionFormDialog({
  open,
  onOpenChange,
  collection,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection;
  onCreated?: (c: Collection) => void;
}) {
  const t = useTranslations('collections.form');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const { user } = useSession();
  const create = useCreateCollection();
  const update = useUpdateCollection(collection?.public_id ?? '');
  const defaults = React.useCallback(
    (): CollectionValues => ({
      name: collection?.name ?? '',
      description: collection?.description ?? '',
      visibility: collection?.visibility ?? 'PRIVATE',
      cover_image_url: collection?.cover_image_url ?? '',
    }),
    [collection],
  );
  const form = useForm<CollectionValues>({ resolver: zodResolver(collectionSchema), defaultValues: defaults() });

  React.useEffect(() => {
    if (open) form.reset(defaults());
  }, [open, defaults, form]);

  async function onSubmit(values: CollectionValues) {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      visibility: values.visibility,
      cover_image_url: values.cover_image_url.trim() || null,
    };
    try {
      if (collection) {
        await update.mutateAsync(payload);
        toast.success(t('updated'));
        onOpenChange(false);
      } else {
        const res = await create.mutateAsync(payload);
        toast.success(t('created'));
        onOpenChange(false);
        onCreated?.(res.data); // after closing, so a navigation here wins over the close handler's URL update
      }
    } catch (error) {
      if (!applyServerErrors(error, form.setError, ['name', 'description', 'visibility', 'cover_image_url'])) toast.error(errorMessage(error));
    }
  }

  const canPublish = !!user?.email_verified;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{collection ? t('editTitle') : t('createTitle')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name')}</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={120} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('descriptionLabel')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} maxLength={1000} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('visibility')}</FormLabel>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary">
                      <RadioGroupItem value="PRIVATE" className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-medium">{t('private')}</span>
                        <span className="block text-xs text-muted-foreground">{t('privateHint')}</span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                      <RadioGroupItem value="PUBLIC" className="mt-0.5" disabled={!canPublish && field.value !== 'PUBLIC'} />
                      <span>
                        <span className="block text-sm font-medium">{t('public')}</span>
                        <span className="block text-xs text-muted-foreground">{canPublish ? t('publicHint') : t('publicNeedsVerification')}</span>
                      </span>
                    </label>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cover_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cover')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" dir="ltr" placeholder="https://" />
                  </FormControl>
                  <FormDescription>{t('coverHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tc('cancel')}
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {collection ? tc('save') : t('create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
