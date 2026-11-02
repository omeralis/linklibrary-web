import { AlertTriangle, SearchX, WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** Server-rendered error panel for public pages (no retry callback; the page can simply be reloaded). */
export function PublicError({ code, status }: { code: string; status: number }) {
  const t = useTranslations('errors');
  const Icon = status === 404 ? SearchX : code === 'NETWORK_ERROR' || code === 'TIMEOUT' ? WifiOff : AlertTriangle;
  const title = status === 404 ? t('notAvailableTitle') : code === 'NETWORK_ERROR' || code === 'TIMEOUT' ? t('networkTitle') : t('title');
  const body =
    status === 404
      ? t('notAvailableBody')
      : code === 'RATE_LIMITED'
        ? t('codes.RATE_LIMITED')
        : code === 'NETWORK_ERROR' || code === 'TIMEOUT'
          ? t('codes.NETWORK_ERROR')
          : t('codes.SERVER_ERROR');
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-14 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
