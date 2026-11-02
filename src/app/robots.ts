import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/api/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/ar/dashboard', '/en/dashboard', '/ar/login', '/en/login', '/ar/register', '/en/register', '/ar/invitations', '/en/invitations'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
