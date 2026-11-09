import type { MetadataRoute } from 'next';
import { BRAND_NAME } from '@/lib/brand';

/**
 * Web app manifest: makes the site installable ("Install app" in Chrome/Edge/Android).
 * The locale redirect (/ -> /ar or /en) is handled by the app, so start_url is the root.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description: 'Save, organise and share the links that matter.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#16181d',
    theme_color: '#0f766e',
    // Android "Share" sheet → LinkLibrary (installed app). Handled by /dashboard/share, which needs a signed-in user.
    share_target: {
      action: '/dashboard/share',
      method: 'GET',
      params: { title: 'title', text: 'text', url: 'url' },
    },
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
