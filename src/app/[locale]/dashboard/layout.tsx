import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children, params }: LayoutProps<'/[locale]/dashboard'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardShell>{children}</DashboardShell>;
}
