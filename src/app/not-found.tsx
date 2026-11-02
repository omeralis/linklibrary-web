import Link from 'next/link';

/** Fallback for paths that bypass the locale proxy (rare). Localized 404s live in app/[locale]/not-found.tsx. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
        <main style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 20 }}>404 — Page not found</h1>
          <p>
            <Link href="/">Go home</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
