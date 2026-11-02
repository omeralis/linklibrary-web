'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Link2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { linksApi } from '@/lib/api/endpoints';
import { isApiError } from '@/lib/api/errors';
import { addLinkSchema, type AddLinkInput, type AddLinkValues } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/form-errors';
import { invalidateLinkData } from '@/hooks/use-links';
import { useCollections } from '@/hooks/use-collections';
import { useErrorMessage } from '@/hooks/use-error-message';
import { CategorySelect } from './category-select';
import { TagInput } from './tag-input';

interface AddLinkContextValue {
  open: (options?: { url?: string; collection?: string }) => void;
}

const AddLinkContext = React.createContext<AddLinkContextValue>({ open: () => undefined });

export function useAddLink() {
  return React.useContext(AddLinkContext);
}

export function AddLinkProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{ open: boolean; url?: string; collection?: string }>({ open: false });
  const value = React.useMemo<AddLinkContextValue>(() => ({ open: (options) => setState({ open: true, ...options }) }), []);
  return (
    <AddLinkContext.Provider value={value}>
      {children}
      <AddLinkDialog open={state.open} initialUrl={state.url} initialCollection={state.collection} onOpenChange={(open) => setState((s) => ({ ...s, open }))} />
    </AddLinkContext.Provider>
  );
}

const FIELDS = ['url', 'custom_title', 'notes', 'category', 'tags', 'collections'] as const;

function AddLinkDialog({
  open,
  onOpenChange,
  initialUrl,
  initialCollection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
  initialCollection?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && <AddLinkForm onClose={() => onOpenChange(false)} initialUrl={initialUrl} initialCollection={initialCollection} />}
      </DialogContent>
    </Dialog>
  );
}

/** Mounted only while open: every opening starts with a fresh form. */
function AddLinkForm({ onClose, initialUrl, initialCollection }: { onClose: () => void; initialUrl?: string; initialCollection?: string }) {
  const t = useTranslations('links.add');
  const tf = useTranslations('links.fields');
  const tc = useTranslations('common');
  const router = useRouter();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const [moreOpen, setMoreOpen] = React.useState(!!initialCollection);
  const collections = useCollections(moreOpen);
  const form = useForm<AddLinkInput, unknown, AddLinkValues>({
    resolver: zodResolver(addLinkSchema),
    defaultValues: { url: initialUrl ?? '', custom_title: '', notes: '', category: '', tags: [], collections: initialCollection ? [initialCollection] : [] },
  });

  async function onSubmit(values: AddLinkValues) {
    try {
      const res = await linksApi.create({
        url: values.url,
        custom_title: values.custom_title?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        category: values.category || undefined,
        tags: values.tags.length ? values.tags : undefined,
        collections: values.collections.length ? values.collections : undefined,
      });
      invalidateLinkData(queryClient);
      const id = res.data.public_id;
      onClose();
      if (res.meta?.already_saved) {
        toast.info(t('alreadySaved'), { action: { label: t('view'), onClick: () => router.push(`/dashboard/links/${id}`) } });
      } else {
        toast.success(t('saved'), { description: t('savedProcessing'), action: { label: t('view'), onClick: () => router.push(`/dashboard/links/${id}`) } });
      }
    } catch (error) {
      if (isApiError(error) && (error.code === 'INVALID_URL' || error.code === 'URL_NOT_ALLOWED') && !error.errors.url) {
        form.setError('url', { type: 'server', message: errorMessage(error) });
        return;
      }
      if (!applyServerErrors(error, form.setError, FIELDS)) toast.error(errorMessage(error));
    }
  }

  return (
    <>
      <DialogHeader>
        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
          <Link2 className="size-5" aria-hidden />
        </div>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>{t('description')}</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tf('url')}</FormLabel>
                <FormControl>
                  <Input {...field} type="url" inputMode="url" dir="ltr" autoComplete="url" autoFocus placeholder="https://" />
                </FormControl>
                <FormDescription>{t('urlHint')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <button
            type="button"
            className="flex items-center gap-1 justify-self-start text-sm font-medium text-primary hover:underline"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
          >
            <ChevronDown className={moreOpen ? 'size-4 rotate-180 transition-transform' : 'size-4 transition-transform'} aria-hidden />
            {t('moreOptions')}
          </button>
          {moreOpen && (
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="custom_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tf('customTitle')}</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={300} placeholder={tf('customTitlePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
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
                  name="tags"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{tf('tags')}</FormLabel>
                      <TagInput value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tf('notes')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} maxLength={10000} placeholder={tf('notesPlaceholder')} />
                    </FormControl>
                    <FormDescription>{tf('notesHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(collections.data?.items.length ?? 0) > 0 && (
                <FormField
                  control={form.control}
                  name="collections"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tf('collections')}</FormLabel>
                      <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-md border p-2">
                        {collections.data!.items.map((c) => {
                          const id = `add-col-${c.public_id}`;
                          const checked = field.value.includes(c.public_id);
                          return (
                            <label key={c.public_id} htmlFor={id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-accent">
                              <Checkbox
                                id={id}
                                checked={checked}
                                onCheckedChange={(v) => field.onChange(v ? [...field.value, c.public_id] : field.value.filter((x) => x !== c.public_id))}
                              />
                              <span className="truncate">{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t('privacyNote')}</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
