'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTagSuggestions } from '@/hooks/use-taxonomy';
import { cn } from '@/lib/utils';

/** Chip input for tags (max 20, ≤50 chars each — backend rules) with autocomplete from GET /tags?q=. */
export function TagInput({
  value,
  onChange,
  max = 20,
  id,
  invalid,
  suggestions = true,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  id?: string;
  invalid?: boolean;
  suggestions?: boolean;
}) {
  const t = useTranslations('links.tags');
  const [draft, setDraft] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const q = useDebouncedValue(draft.trim(), 200);
  const tags = useTagSuggestions(q, suggestions && focused && q.length >= 1);
  const listId = React.useId();
  const [highlight, setHighlight] = React.useState(-1);

  const options = (tags.data ?? [])
    .map((tag) => tag.name)
    .filter((name) => !value.includes(name))
    .slice(0, 6);

  function add(raw: string) {
    const tag = raw.trim().replace(/,+$/, '').slice(0, 50);
    if (!tag || value.includes(tag) || value.length >= max) return;
    onChange([...value, tag]);
    setDraft('');
    setHighlight(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(highlight >= 0 && options[highlight] ? options[highlight] : draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    } else if (e.key === 'ArrowDown' && options.length) {
      e.preventDefault();
      setHighlight((h) => (h + 1) % options.length);
    } else if (e.key === 'ArrowUp' && options.length) {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? options.length - 1 : h - 1));
    } else if (e.key === 'Escape') {
      setHighlight(-1);
    }
  }

  const showList = focused && options.length > 0 && draft.trim().length > 0;

  return (
    <div className="relative">
      <div
        className={cn(
          'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30',
          invalid && 'border-destructive',
        )}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 ps-2 pe-1">
            <span className="max-w-40 truncate">{tag}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="rounded-sm p-0.5 hover:bg-background/60"
              aria-label={t('remove', { tag })}
            >
              <X className="size-3" aria-hidden />
            </button>
          </Badge>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setHighlight(-1);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 120);
            if (draft.trim()) add(draft);
          }}
          placeholder={value.length >= max ? t('limit', { max }) : t('placeholder')}
          disabled={value.length >= max}
          className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={highlight >= 0 ? `${listId}-${highlight}` : undefined}
        />
      </div>
      {showList && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-lg border bg-popover p-1 shadow-md">
          {options.map((option, index) => (
            <li
              key={option}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                add(option);
              }}
              className={cn('cursor-default rounded-md px-2 py-1.5 text-sm', index === highlight ? 'bg-accent' : 'hover:bg-accent')}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
