'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RemoteImage } from '@/components/common/remote-image';
import type { OwnedLink, SourceType } from '@/lib/api/types';
import { editLinkSchema, SOURCE_TYPES, type EditLinkValues } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { useCoverMutations, useUpdateLink } from '@/hooks/use-links';
import { useErrorMessage } from '@/hooks/use-error-message';
import { CategorySelect } from './category-select';
import { TagInput } from './tag-input';

const AUTO = '__auto__';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const FIELDS = ['custom_title', 'custom_description', 'custom_image_url', 'custom_source_type', 'notes', 'category', 'tags'] as const;

function valuesFrom(link: OwnedLink): EditLinkValues {
  return {
    custom_title: link.overrides.title ?? '',
    custom_description: link.overrides.description ?? '',
    custom_image_url: link.overrides.image_url && !isUploaded(link) ? link.overrides.image_url : '',
    custom_source_type: link.overrides.source_type ?? '',
    notes: link.notes ?? '',
    category: link.overrides.category?.slug ?? '',
    tags: link.tags.filter((tag) => tag.source !== 'AI').map((tag) => tag.name),
  };
}

/** Heuristic: uploaded covers are served from the API's storage, custom URLs point elsewhere. */
function isUploaded(link: OwnedLink): boolean {
  return !!link.overrides.image_url && /\/storage\//.test(link.overrides.image_url);
}

const nullIfEmpty = (v: string) => (v.trim() === '' ? null : v.trim());

/**
 * Edits the owner's manual overrides. Empty fields are sent as `null`, which clears the override so
 * the display falls back to extracted metadata (then AI, then hostname). Extracted values are shown
 * as placeholders.
 */
export function LinkEditForm({ link, onSaved }: { link: OwnedLink; onSaved?: () => void }) {
  const t = useTranslations('links.edit');
  const tf = useTranslations('links.fields');
  const ts = useTranslations('links.sourceTypes');
  const errorMessage = useErrorMessage();
  const update = useUpdateLink(link.public_id);
  const cover = useCoverMutations(link.public_id);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<EditLinkValues>({ resolver: zodResolver(editLinkSchema), defaultValues: valuesFrom(link) });

  React.useEffect(() => {
    if (!form.formState.isDirty) form.reset(valuesFrom(link));
  }, [link, form]);

  async function onSubmit(values: EditLinkValues) {
    try {
      const res = await update.mutateAsync({
        custom_title: nullIfEmpty(values.custom_title),
        custom_description: nullIfEmpty(values.custom_description),
        custom_image_url: isUploaded(link) && !values.custom_image_url ? undefined : nullIfEmpty(values.custom_image_url),
        custom_source_type: (values.custom_source_type || null) as SourceType | null,
        notes: nullIfEmpty(values.notes),
        category: values.category || null,
        tags: values.tags,
      });
      form.reset(valuesFrom(res.data));
      toast.success(t('saved'));
      onSaved?.();
    } catch (error) {
      if (!applyServerErrors(error, form.setError, FIELDS)) toast.error(errorMessage(error));
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return void toast.error(t('coverType'));
    if (file.size > MAX_IMAGE_BYTES) return void toast.error(t('coverSize'));
    cover.upload.mutate(file, { onSuccess: () => toast.success(t('coverUpdated')), onError: (err) => toast.error(errorMessage(err)) });
  }

  const watched = useWatch({ control: form.control, name: ['custom_title', 'custom_description'] });
  const resetButton = (name: 'custom_title' | 'custom_description') =>
    watched[name === 'custom_title' ? 0 : 1] ? (
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => form.setValue(name, '', { shouldDirty: true })}>
        <RotateCcw className="size-3" aria-hidden /> {t('useExtracted')}
      </Button>
    ) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5" noValidate>
              <FormField
                control={form.control}
                name="custom_title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>{tf('title')}</FormLabel>
                      {resetButton('custom_title')}
                    </div>
                    <FormControl>
                      <Input {...field} maxLength={300} placeholder={link.extracted.title ?? link.hostname} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="custom_description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>{tf('description')}</FormLabel>
                      {resetButton('custom_description')}
                    </div>
                    <FormControl>
                      <Textarea {...field} rows={4} maxLength={5000} placeholder={link.extracted.description ?? t('noExtractedDescription')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tf('category')}</FormLabel>
                      <CategorySelect value={field.value} onChange={field.onChange} noneLabel={tf('categoryAuto')} ariaLabel={tf('category')} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custom_source_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tf('sourceType')}</FormLabel>
                      <Select value={field.value || AUTO} onValueChange={(v) => field.onChange(v === AUTO ? '' : v)}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={AUTO}>{t('autoDetected', { type: ts(link.extracted.source_type) })}</SelectItem>
                          {SOURCE_TYPES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {ts(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="tags"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{tf('tags')}</FormLabel>
                    <TagInput value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />
                    <FormDescription>{t('tagsHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="custom_image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tf('imageUrl')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" dir="ltr" placeholder={link.extracted.image_url ?? 'https://'} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tf('notes')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} maxLength={10000} placeholder={tf('notesPlaceholder')} />
                    </FormControl>
                    <FormDescription>{tf('notesHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!form.formState.isDirty || form.formState.isSubmitting}
                  onClick={() => form.reset(valuesFrom(link))}
                >
                  {t('discard')}
                </Button>
                <Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
                  {t('save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">{t('coverTitle')}</CardTitle>
          <CardDescription>{t('coverDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="aspect-[1.91/1] overflow-hidden rounded-lg border bg-muted">
            <RemoteImage
              src={link.image_url}
              className="size-full"
              fallback={<div className="flex size-full items-center justify-center text-xs text-muted-foreground">{t('noImage')}</div>}
            />
          </div>
          <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" onChange={onFile} aria-label={t('uploadCover')} tabIndex={-1} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} loading={cover.upload.isPending}>
            <ImagePlus aria-hidden /> {t('uploadCover')}
          </Button>
          {isUploaded(link) && (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              loading={cover.remove.isPending}
              onClick={() =>
                cover.remove.mutate(undefined, { onSuccess: () => toast.success(t('coverRemoved')), onError: (e) => toast.error(errorMessage(e)) })
              }
            >
              <Trash2 aria-hidden /> {t('removeCover')}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">{t('coverHint')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
