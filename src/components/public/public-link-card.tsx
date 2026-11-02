import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { LinkFavicon } from '@/components/common/link-favicon';
import { RemoteImage } from '@/components/common/remote-image';
import type { PublicLink } from '@/lib/api/types';
import { categoryName, formatDate } from '@/lib/format';

/** Server-renderable card for public listings (explore, profiles, public collections). */
export function PublicLinkCard({ link }: { link: PublicLink }) {
  const locale = useLocale();
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-ring/40 hover:shadow-sm">
      <div className="aspect-[1.91/1] overflow-hidden border-b bg-muted">
        <RemoteImage
          src={link.image_url}
          className="size-full transition-transform duration-300 group-hover:scale-[1.02]"
          fallback={
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-brand-soft/60">
              <span className="flex items-center gap-2 rounded-full bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground" dir="ltr">
                <LinkFavicon src={link.favicon_url} />
                {link.hostname}
              </span>
            </div>
          }
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LinkFavicon src={link.favicon_url} />
          <span className="truncate" dir="ltr">
            {link.site_name || link.hostname}
          </span>
          {link.published_at && (
            <>
              <span aria-hidden>·</span>
              <time dateTime={link.published_at} className="shrink-0">
                {formatDate(link.published_at, locale)}
              </time>
            </>
          )}
        </div>
        <h3 className="line-clamp-2 leading-snug font-semibold">
          <Link href={`/l/${link.public_id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {link.title}
          </Link>
        </h3>
        {link.description && <p className="line-clamp-2 text-sm text-muted-foreground">{link.description}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {link.category && <Badge variant="outline">{categoryName(link.category, locale)}</Badge>}
          {link.tags.slice(0, 3).map((tag) => (
            <span key={tag.slug} className="text-xs text-muted-foreground">
              #{tag.name}
            </span>
          ))}
          {link.owner && <span className="ms-auto truncate text-xs text-muted-foreground">@{link.owner.username}</span>}
        </div>
      </div>
    </article>
  );
}
