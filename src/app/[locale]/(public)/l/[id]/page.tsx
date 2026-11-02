import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LinkPageView } from '@/components/public/link-page-view';
import { PublicError } from '@/components/public/public-error';
import { serverPublicApi } from '@/lib/api/server';
import { ApiError } from '@/lib/api/errors';
import type { PublicLink } from '@/lib/api/types';
import { safeImageUrl } from '@/lib/url';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadPublic(locale: string, id: string): Promise<{ link: PublicLink | null; error: ApiError | null }> {
  if (!UUID.test(id)) return { link: null, error: null };
  try {
    return { link: await serverPublicApi.link(locale, id), error: null };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { link: null, error: null };
    return { link: null, error: error instanceof ApiError ? error : new ApiError(0, 'NETWORK_ERROR', '') };
  }
}

export async function generateMetadata({ params }: PageProps<'/[locale]/l/[id]'>): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'linkPage' });
  const { link } = await loadPublic(locale, id);
  if (!link) return { title: t('unavailableTitle'), robots: { index: false } };
  const image = safeImageUrl(link.image_url);
  return {
    title: link.title,
    description: link.description ?? undefined,
    alternates: { canonical: `/${locale}/l/${id}`, languages: { ar: `/ar/l/${id}`, en: `/en/l/${id}` } },
    openGraph: { type: 'article', title: link.title, description: link.description ?? undefined, images: image ? [{ url: image }] : undefined },
  };
}

export default async function LinkPage({ params }: PageProps<'/[locale]/l/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { link, error } = await loadPublic(locale, id);
  if (error) {
    return (
      <div className="container-page max-w-2xl py-16">
        <PublicError code={error.code} status={error.status} />
      </div>
    );
  }
  return (
    <Suspense>
      <LinkPageView id={id} initial={link} />
    </Suspense>
  );
}
