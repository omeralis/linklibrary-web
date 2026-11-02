import { ShieldCheck, Sparkles, FolderOpen, Search } from 'lucide-react';

/**
 * Decorative, abstract product illustration (no names, numbers or URLs): stacked "link cards"
 * drawn with neutral shapes. Hidden from assistive technology.
 */
export function HeroIllustration() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-lg select-none">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-soft/60 blur-2xl dark:bg-brand-soft/30" />
      <div className="rounded-2xl border bg-card p-3 shadow-lg">
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <div className="h-2.5 w-40 rounded-full bg-muted" />
          <div className="ms-auto h-5 w-10 rounded bg-muted" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border bg-background">
              <div className={i % 2 === 0 ? 'h-16 bg-gradient-to-br from-brand-soft to-muted' : 'h-16 bg-gradient-to-br from-muted to-secondary'} />
              <div className="space-y-1.5 p-2.5">
                <div className="h-2 w-16 rounded-full bg-muted" />
                <div className="h-2.5 w-full rounded-full bg-foreground/15" />
                <div className="h-2.5 w-3/4 rounded-full bg-foreground/10" />
                <div className="flex gap-1 pt-1">
                  <span className="h-3.5 w-10 rounded bg-success-soft" />
                  <span className="h-3.5 w-8 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -start-6 top-16 hidden items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs shadow-md sm:flex">
        <ShieldCheck className="size-4 text-success" />
        <div className="h-2 w-16 rounded-full bg-muted" />
      </div>
      <div className="absolute -end-5 bottom-20 hidden items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs shadow-md sm:flex">
        <Sparkles className="size-4 text-primary" />
        <div className="h-2 w-20 rounded-full bg-muted" />
      </div>
      <div className="absolute -bottom-5 start-10 hidden items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs shadow-md sm:flex">
        <FolderOpen className="size-4 text-muted-foreground" />
        <div className="h-2 w-12 rounded-full bg-muted" />
      </div>
    </div>
  );
}
