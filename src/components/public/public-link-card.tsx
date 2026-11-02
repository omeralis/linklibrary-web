import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { LinkFavicon } from '@/components/common/link-favicon';
import { CardMedia } from '@/components/links/link-card';
import type { PublicLink } from '@/lib/api/types';
import { categoryName, formatDate } from '@/lib/format';

/** Server-renderable card for public listings (explore, profiles, public collections). */
export function PublicLinkCard({ link }: { link: PublicLink }) {
  const locale = useLocale();
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-ring/40 hover:shadow-sm">
      <CardMedia src={link.image_url} />
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
            <bdi>{link.title}</bdi>
          </Link>
        </h3>
        {link.description && <p className="line-clamp-2 text-sm text-muted-foreground"><bdi>{link.description}</bdi></p>}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {link.category && <Badge variant="outline">{categoryName(link.category, locale)}</Badge>}
          {link.tags.slice(0, 3).map((tag) => (
            <span key={tag.slug} className="text-xs text-muted-foreground">
              <bdi>#{tag.name}</bdi>
            </span>
          ))}
          {link.owner && <span className="ms-auto truncate text-xs text-muted-foreground">@{link.owner.username}</span>}
        </div>
      </div>
    </article>
  );
}
