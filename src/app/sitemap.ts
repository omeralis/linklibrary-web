import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/api/config';
import { routing } from '@/i18n/routing';

/** Static public routes in both languages (public links/profiles are discoverable through /explore). */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/explore', '/about', '/privacy', '/terms', '/contact'];
  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      changeFrequency: path === '/explore' ? ('hourly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.6,
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`])) },
    })),
  );
}
