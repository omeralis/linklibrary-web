import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/** Locale negotiation and redirects (/ → /ar or /en, /verify-email → /{locale}/verify-email). */
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals and files with an extension (favicon.ico, robots.txt, …).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
