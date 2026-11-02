import { FileWarning } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Section {
  heading: string;
  body: string[];
}

/** Long-form static page whose sections come from messages/{locale}.json (`<namespace>.sections`). */
export async function ProsePage({ namespace, draft = false, updated }: { namespace: 'about' | 'privacy' | 'terms'; draft?: boolean; updated?: string }) {
  const t = await getTranslations(namespace);
  const tl = await getTranslations('legal');
  const sections = t.raw('sections') as Section[];
  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t('intro')}</p>
        {updated && <p className="mt-2 text-xs text-muted-foreground">{tl('updated', { date: updated })}</p>}
      </header>
      {draft && (
        <Alert variant="warning" className="mb-8">
          <FileWarning aria-hidden />
          <AlertTitle>{tl('draftTitle')}</AlertTitle>
          <AlertDescription>{tl('draftBody')}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-3 text-xl font-semibold">{section.heading}</h2>
            <div className="grid gap-3 leading-relaxed text-muted-foreground">
              {section.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
