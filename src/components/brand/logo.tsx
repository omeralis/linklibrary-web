import { cn } from '@/lib/utils';
import { BRAND_NAME } from '@/lib/brand';

/** Mark: two overlapping rounded "cards" forming a chain link, inside a soft tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-7', className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <rect x="7" y="9.5" width="12" height="13" rx="3.5" fill="none" strokeWidth="2.4" className="stroke-primary-foreground" />
      <rect x="13" y="9.5" width="12" height="13" rx="3.5" fill="none" strokeWidth="2.4" className="stroke-primary-foreground/70" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <LogoMark />
      {!compact && (
        <span className="text-[15px]" dir="ltr">
          {BRAND_NAME}
        </span>
      )}
    </span>
  );
}
