'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { linksApi, type UpdateLinkPayload } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { PROCESSING_POLL_MS } from '@/lib/api/config';
import type { AnyLink, LinkListParams, OwnedLink, Paginated, Visibility } from '@/lib/api/types';
import { isProcessing } from '@/lib/link-status';

export function invalidateLinkData(queryClient: QueryClient, id?: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.links.all });
  queryClient.invalidateQueries({ queryKey: ['search'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
  if (id) queryClient.invalidateQueries({ queryKey: queryKeys.links.detail(id) });
}

function sameView(a: LinkListParams, b: LinkListParams) {
  return (a.trashed ?? null) === (b.trashed ?? null) && Boolean(a.favorite) === Boolean(b.favorite);
}

/** My links. While any visible link is still processing, the page refreshes every few seconds. */
export function useLinksList(params: LinkListParams) {
  return useQuery({
    queryKey: queryKeys.links.list(params),
    queryFn: ({ signal }) => linksApi.list(params, signal),
    // Keep the previous page on screen while paging/searching within the SAME view, but never across
    // views: showing library items under "Trash" (or vice versa) would offer the wrong actions on them.
    placeholderData: (prev, prevQuery) => {
      const prevParams = prevQuery?.queryKey[2] as LinkListParams | undefined;
      return prevParams && sameView(prevParams, params) ? prev : undefined;
    },
    refetchInterval: (query) => {
      const data = query.state.data as Paginated<OwnedLink> | undefined;
      return data?.items.some((l) => isProcessing(l.processing_status)) ? PROCESSING_POLL_MS + 2000 : false;
    },
  });
}

/** Total count for a filter, using per_page=1 (the API returns pagination.total). */
export function useLinksCount(params: LinkListParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.links.counts, params],
    queryFn: ({ signal }) => linksApi.list({ ...params, per_page: 1 }, signal),
    select: (page) => page.pagination.total ?? page.items.length,
    enabled,
  });
}

export function useLink(id: string, enabled = true) {
  return useQuery<AnyLink>({
    queryKey: queryKeys.links.detail(id),
    queryFn: ({ signal }) => linksApi.get(id, signal),
    enabled: enabled && !!id,
  });
}

/**
 * Polls GET /links/{id}/processing-status every 3 s while PENDING/PROCESSING (handoff §4.1) and
 * refreshes the full link once the pipeline settles.
 */
export function useProcessingPoll(link: OwnedLink | undefined) {
  const queryClient = useQueryClient();
  const active = !!link && isProcessing(link.processing_status);
  const id = link?.public_id ?? '';
  const query = useQuery({
    queryKey: queryKeys.links.processing(id),
    queryFn: ({ signal }) => linksApi.processingStatus(id, signal),
    enabled: active,
    refetchInterval: (q) => (isProcessing(q.state.data?.status ?? 'PENDING') ? PROCESSING_POLL_MS : false),
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
  const settled = useRef(false);
  const status = query.data?.status;
  useEffect(() => {
    if (!active) {
      settled.current = false;
      return;
    }
    if (status && !isProcessing(status) && !settled.current) {
      settled.current = true;
      invalidateLinkData(queryClient, id);
    }
  }, [active, status, id, queryClient]);
  return query;
}

export function useUpdateLink(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLinkPayload) => linksApi.update(id, payload),
    onSuccess: (res) => {
      queryClient.setQueryData(queryKeys.links.detail(id), res.data);
      invalidateLinkData(queryClient);
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permanent = false }: { id: string; permanent?: boolean }) => linksApi.remove(id, permanent),
    onSuccess: (_res, { id }) => {
      queryClient.removeQueries({ queryKey: queryKeys.links.detail(id) });
      invalidateLinkData(queryClient);
    },
  });
}

export function useRestoreLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => linksApi.restore(id),
    onSuccess: (res) => {
      queryClient.setQueryData(queryKeys.links.detail(res.data.public_id), res.data);
      invalidateLinkData(queryClient);
    },
  });
}

/** Optimistic favorite toggle across cached lists and the detail view. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) => linksApi.favorite(id, favorite),
    onMutate: async ({ id, favorite }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });
      const lists = queryClient.getQueriesData<Paginated<OwnedLink>>({ queryKey: ['links', 'list'] });
      const detail = queryClient.getQueryData<AnyLink>(queryKeys.links.detail(id));
      for (const [key, data] of lists) {
        if (!data) continue;
        queryClient.setQueryData(key, { ...data, items: data.items.map((l) => (l.public_id === id ? { ...l, is_favorite: favorite } : l)) });
      }
      if (detail && detail.access_role === 'owner') queryClient.setQueryData(queryKeys.links.detail(id), { ...detail, is_favorite: favorite });
      return { lists, detail };
    },
    onError: (_err, { id }, context) => {
      context?.lists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.detail) queryClient.setQueryData(queryKeys.links.detail(id), context.detail);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.links.counts });
      queryClient.invalidateQueries({ queryKey: ['links', 'list'] });
    },
  });
}

export function useSetVisibility(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visibility: Visibility) => linksApi.setVisibility(id, visibility),
    onSuccess: (res) => {
      queryClient.setQueryData(queryKeys.links.detail(id), res.data);
      invalidateLinkData(queryClient);
    },
  });
}

export function useSetResharing(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (allow: boolean) => linksApi.setResharing(id, allow),
    onSuccess: (res) => {
      const current = queryClient.getQueryData<AnyLink>(queryKeys.links.detail(id));
      if (current?.access_role === 'owner') queryClient.setQueryData(queryKeys.links.detail(id), { ...current, allow_resharing: res.data.allow_resharing });
      queryClient.invalidateQueries({ queryKey: queryKeys.sharing.access(id) });
    },
  });
}

export function useReanalyze(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => linksApi.reanalyze(id),
    onSuccess: (res) => {
      const current = queryClient.getQueryData<AnyLink>(queryKeys.links.detail(id));
      if (current?.access_role === 'owner') {
        queryClient.setQueryData(queryKeys.links.detail(id), { ...current, processing: res.data, processing_status: res.data.status });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.links.processing(id) });
    },
  });
}

export function useCoverMutations(id: string) {
  const queryClient = useQueryClient();
  const onSuccess = (res: { data: OwnedLink }) => {
    queryClient.setQueryData(queryKeys.links.detail(id), res.data);
    invalidateLinkData(queryClient);
  };
  const upload = useMutation({ mutationFn: (file: File) => linksApi.uploadCover(id, file), onSuccess });
  const remove = useMutation({ mutationFn: () => linksApi.deleteCover(id), onSuccess });
  return { upload, remove };
}

export function useSecurityDetails(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.links.security(id),
    queryFn: () => linksApi.security(id),
    enabled,
  });
}

export function useSecurityActions(id: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.links.security(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.links.detail(id) });
  };
  const rescan = useMutation({ mutationFn: () => linksApi.rescan(id), onSuccess: refresh });
  const appeal = useMutation({ mutationFn: (reason: string) => linksApi.appeal(id, reason), onSuccess: refresh });
  return { rescan, appeal };
}

export function useTagMutations(id: string) {
  const queryClient = useQueryClient();
  const onSuccess = (res: { data: OwnedLink }) => {
    queryClient.setQueryData(queryKeys.links.detail(id), res.data);
    invalidateLinkData(queryClient);
  };
  const add = useMutation({ mutationFn: (tags: string[]) => linksApi.addTags(id, tags), onSuccess });
  const remove = useMutation({ mutationFn: (slug: string) => linksApi.removeTag(id, slug), onSuccess });
  return { add, remove };
}
