'use client';

import { CircleDashed, Globe2, Loader2, Lock, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX, AlertCircle, CheckCircle2, Ban } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ProcessingStatus, SecurityStatus, Visibility } from '@/lib/api/types';
import { securityTone } from '@/lib/link-status';

const SECURITY_ICON = {
  CLEAR: ShieldCheck,
  PENDING: CircleDashed,
  UNKNOWN: ShieldQuestion,
  SUSPICIOUS: ShieldAlert,
  MALICIOUS: ShieldX,
} as const;

const TONE_TO_VARIANT = { success: 'success', info: 'info', neutral: 'muted', warning: 'warning', danger: 'danger' } as const;

/**
 * Security verdict badge. Wording never claims a link is "safe" (handoff §4.3): CLEAR reads as
 * "No threats found", and every badge carries a text label (not colour alone) for accessibility.
 */
export function SecurityBadge({
  status,
  showTooltip = true,
  hideWhenClear = false,
}: {
  status: SecurityStatus;
  showTooltip?: boolean;
  hideWhenClear?: boolean;
}) {
  const t = useTranslations('security');
  if (hideWhenClear && status === 'CLEAR') return null;
  const Icon = SECURITY_ICON[status];
  const badge = (
    <Badge variant={TONE_TO_VARIANT[securityTone(status)]} aria-label={`${t('label')}: ${t(`status.${status}`)}`}>
      <Icon className={status === 'PENDING' ? 'animate-spin [animation-duration:3s]' : undefined} aria-hidden />
      {t(`status.${status}`)}
    </Badge>
  );
  if (!showTooltip) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex rounded-md">
          {badge}
        </span>
      </TooltipTrigger>
      <TooltipContent>{t(`explain.${status}`)}</TooltipContent>
    </Tooltip>
  );
}

const PROCESSING_ICON = {
  PENDING: Loader2,
  PROCESSING: Loader2,
  COMPLETED: CheckCircle2,
  PARTIAL: AlertCircle,
  FAILED: AlertCircle,
  BLOCKED: Ban,
} as const;

export function ProcessingBadge({ status, hideWhenDone = true }: { status: ProcessingStatus; hideWhenDone?: boolean }) {
  const t = useTranslations('links.processing');
  if (hideWhenDone && status === 'COMPLETED') return null;
  const Icon = PROCESSING_ICON[status];
  const variant = status === 'FAILED' || status === 'BLOCKED' ? 'danger' : status === 'PARTIAL' ? 'warning' : status === 'COMPLETED' ? 'success' : 'info';
  return (
    <Badge variant={variant} role="status">
      <Icon className={status === 'PENDING' || status === 'PROCESSING' ? 'animate-spin' : undefined} aria-hidden />
      {t(`status.${status}`)}
    </Badge>
  );
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const t = useTranslations('links.visibility');
  return visibility === 'PUBLIC' ? (
    <Badge variant="brand">
      <Globe2 aria-hidden />
      {t('PUBLIC')}
    </Badge>
  ) : (
    <Badge variant="muted">
      <Lock aria-hidden />
      {t('PRIVATE')}
    </Badge>
  );
}
