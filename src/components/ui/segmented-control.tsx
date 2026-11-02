'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Filter switch styled like tabs. Unlike tabs it does not own panels (the list below simply refetches),
 * so it is exposed as a group of toggle buttons (aria-pressed) — no dangling aria-controls.
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex h-9 w-fit max-w-full items-center overflow-x-auto rounded-lg bg-muted p-[3px] text-muted-foreground', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
              active ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
