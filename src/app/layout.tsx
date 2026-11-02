import type { ReactNode } from 'react';
import './globals.css';

/** The real document shell lives in app/[locale]/layout.tsx (lang/dir depend on the locale). */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
