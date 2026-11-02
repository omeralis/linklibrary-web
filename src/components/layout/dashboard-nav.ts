import { Bell, Bookmark, FolderOpen, Home, Library, Search, Settings, ShieldCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  key: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
}

export const DASHBOARD_NAV: NavItem[][] = [
  [
    { href: '/dashboard', key: 'overview', icon: Home, exact: true },
    { href: '/dashboard/links', key: 'library', icon: Library },
    { href: '/dashboard/favorites', key: 'favorites', icon: Bookmark },
    { href: '/dashboard/collections', key: 'collections', icon: FolderOpen },
    { href: '/dashboard/shared', key: 'shared', icon: Users },
  ],
  [
    { href: '/dashboard/search', key: 'search', icon: Search },
    { href: '/dashboard/notifications', key: 'notifications', icon: Bell },
    { href: '/dashboard/settings', key: 'settings', icon: Settings },
    { href: '/dashboard/admin', key: 'admin', icon: ShieldCheck, adminOnly: true },
  ],
];

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
