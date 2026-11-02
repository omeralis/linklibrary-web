'use client';

import * as React from 'react';
import { CornerDownRight, UserX } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ErrorState } from '@/components/common/error-state';
import { UserAvatar } from '@/components/layout/user-avatar';
import type { Grant } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { useAccessGraph, useSharingMutations } from '@/hooks/use-sharing';
import { useErrorMessage } from '@/hooks/use-error-message';

interface Node {
  grant: Grant;
  children: Node[];
}

/** Builds the reshare tree from parent_grant_id (grants whose parent is not visible become roots). */
export function buildGrantTree(grants: Grant[]): Node[] {
  const nodes = new Map<string, Node>(grants.map((g) => [g.id, { grant: g, children: [] }]));
  const roots: Node[] = [];
  for (const node of nodes.values()) {
    const parent = node.grant.parent_grant_id ? nodes.get(node.grant.parent_grant_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Number of still-effective grants that depend on this one (revoked together, recursively). */
export function countDependents(node: Node): number {
  return node.children.reduce((sum, child) => sum + (child.grant.effective ? 1 : 0) + countDependents(child), 0);
}

function subtreeGrants(node: Node): Grant[] {
  return [node.grant, ...node.children.flatMap(subtreeGrants)];
}

/**
 * Who actually loses access when `node` is revoked — the same rule the API applies: every effective grant
 * in the subtree is revoked, but a person who also holds an effective grant OUTSIDE that subtree keeps
 * access (an independent path). `all` must be the full list the caller can see; for a resharing viewer
 * (who only sees their own grants) the result is an upper bound, which the dialog states.
 */
export function revocationImpact(all: Grant[], node: Node): { targetLoses: boolean; dependents: number } {
  const inSubtree = new Set(subtreeGrants(node).map((g) => g.id));
  const keeps = new Set(all.filter((g) => g.effective && g.status === 'ACTIVE' && !inSubtree.has(g.id)).map((g) => g.grantee.username));
  const target = node.grant.grantee.username;
  const losing = new Set(
    subtreeGrants(node)
      .filter((g) => g.effective && g.grantee.username !== target && !keeps.has(g.grantee.username))
      .map((g) => g.grantee.username),
  );
  return { targetLoses: !keeps.has(target), dependents: losing.size };
}

function findNode(nodes: Node[], id: string): Node | undefined {
  for (const n of nodes) {
    if (n.grant.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Access graph (GET /links/{id}/access). Owner sees every grant; a resharing viewer sees only the grants
 * they issued. Revoking a grant also revokes everything reshared through it — the confirmation states how many.
 */
export function AccessGraph({ linkId, isOwner }: { linkId: string; isOwner: boolean }) {
  const t = useTranslations('sharing.access');
  const errorMessage = useErrorMessage();
  const graph = useAccessGraph(linkId);
  const { revokeGrant } = useSharingMutations(linkId);
  const [targetId, setTargetId] = React.useState<string | null>(null);
  const [showRevoked, setShowRevoked] = React.useState(false);

  if (graph.isPending) return <Skeleton className="h-24" />;
  if (graph.isError) return <ErrorState error={graph.error} onRetry={() => graph.refetch()} compact />;

  const grants = showRevoked ? graph.data.grants : graph.data.grants.filter((g) => g.status === 'ACTIVE');
  const tree = buildGrantTree(grants);
  const target = targetId ? findNode(buildGrantTree(graph.data.grants), targetId) : undefined;
  const impact = target ? revocationImpact(graph.data.grants, target) : { targetLoses: true, dependents: 0 };
  const dependents = impact.dependents;
  const revokedCount = graph.data.grants.filter((g) => g.status !== 'ACTIVE').length;

  return (
    <div className="grid gap-3">
      {isOwner && graph.data.meta && tree.length > 0 && (
        <p className="text-sm text-muted-foreground">{t('viewerCount', { count: graph.data.meta.viewer_count })}</p>
      )}
      {tree.length === 0 ? (
        <p className="text-sm text-muted-foreground">{isOwner ? t('emptyOwner') : t('emptyViewer')}</p>
      ) : (
        <ul className="grid gap-1" aria-label={t('treeLabel')}>
          {tree.map((node) => (
            <GrantNode key={node.grant.id} node={node} level={1} onRevoke={setTargetId} />
          ))}
        </ul>
      )}
      {revokedCount > 0 && (
        <Button variant="link" size="sm" className="justify-self-start px-0" onClick={() => setShowRevoked((v) => !v)}>
          {showRevoked ? t('hideRevoked') : t('showRevoked', { count: revokedCount })}
        </Button>
      )}
      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && setTargetId(null)}
        title={t('revokeTitle', { name: target?.grant.grantee.name ?? '' })}
        description={
          <div className="grid gap-2">
            <p>{impact.targetLoses ? t('revokeBody') : t('revokeKeeps', { name: target?.grant.grantee.name ?? '' })}</p>
            {dependents > 0 && <p className="font-medium text-destructive">{t('revokeCascade', { count: dependents })}</p>}
            <p>{t('revokeIndependent')}</p>
          </div>
        }
        confirmLabel={t('revoke')}
        onConfirm={() =>
          revokeGrant.mutateAsync(targetId!, {
            onSuccess: (r) => toast.success(t('revoked', { count: r.data.revoked_users })),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </div>
  );
}

function GrantNode({ node, level, onRevoke }: { node: Node; level: number; onRevoke: (id: string) => void }) {
  const t = useTranslations('sharing.access');
  const locale = useLocale();
  const g = node.grant;
  return (
    <li aria-level={level}>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2" style={{ marginInlineStart: `${(level - 1) * 1.25}rem` }}>
        {level > 1 && <CornerDownRight className="size-4 shrink-0 text-muted-foreground rtl-flip" aria-hidden />}
        <UserAvatar name={g.grantee.name} className="size-7" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {g.grantee.name}{' '}
            <span className="font-normal text-muted-foreground" dir="ltr">
              @{g.grantee.username}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t('grantedBy', { name: g.grantor.name })} · {formatDate(g.created_at, locale)}
          </p>
        </div>
        {g.status !== 'ACTIVE' ? (
          <Badge variant="muted">{t('statusRevoked')}</Badge>
        ) : !g.effective ? (
          <Badge variant="warning">{t('statusInactive')}</Badge>
        ) : (
          <>
            <Badge variant="muted">{t('readOnly')}</Badge>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onRevoke(g.id)}>
              <UserX aria-hidden /> {t('revoke')}
            </Button>
          </>
        )}
      </div>
      {node.children.length > 0 && (
        <ul className="mt-1 grid gap-1">
          {node.children.map((child) => (
            <GrantNode key={child.grant.id} node={child} level={level + 1} onRevoke={onRevoke} />
          ))}
        </ul>
      )}
    </li>
  );
}
