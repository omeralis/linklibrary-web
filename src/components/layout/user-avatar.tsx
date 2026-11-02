import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/format';
import { safeImageUrl } from '@/lib/url';
import { cn } from '@/lib/utils';

export function UserAvatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  const url = safeImageUrl(src);
  return (
    <Avatar className={cn(className)}>
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback>
        {/* Initials are decorative: drawn with CSS so they never compete with the control's accessible name. */}
        <span aria-hidden data-initials={initials(name)} className="before:content-[attr(data-initials)]" />
      </AvatarFallback>
    </Avatar>
  );
}
