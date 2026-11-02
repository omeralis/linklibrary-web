'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collectionsApi, type CollectionPayload } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import type { Collection } from '@/lib/api/types';

export function useCollections(enabled = true) {
  return useQuery({
    queryKey: queryKeys.collections.list,
    queryFn: () => collectionsApi.list(1, 50),
    enabled,
  });
}

export function useCollection(id: string) {
  return useQuery({ queryKey: queryKeys.collections.detail(id), queryFn: () => collectionsApi.get(id), enabled: !!id });
}

function useInvalidateCollections() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.collections.list });
    if (id) queryClient.invalidateQueries({ queryKey: queryKeys.collections.detail(id) });
  };
}

export function useCreateCollection() {
  const invalidate = useInvalidateCollections();
  return useMutation({ mutationFn: (payload: CollectionPayload) => collectionsApi.create(payload), onSuccess: () => invalidate() });
}

export function useUpdateCollection(id: string) {
  const invalidate = useInvalidateCollections();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CollectionPayload) => collectionsApi.update(id, payload),
    onSuccess: (res) => {
      const current = queryClient.getQueryData<Collection>(queryKeys.collections.detail(id));
      if (current) queryClient.setQueryData(queryKeys.collections.detail(id), { ...current, ...res.data, items: current.items });
      invalidate(id);
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => collectionsApi.remove(id),
    onSuccess: (_r, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.collections.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.list });
    },
  });
}

export function useAddLinksToCollection() {
  const invalidate = useInvalidateCollections();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, links }: { id: string; links: string[] }) => collectionsApi.addLinks(id, links),
    onSuccess: (_r, { id }) => {
      invalidate(id);
      queryClient.invalidateQueries({ queryKey: ['links', 'list'] });
    },
  });
}

export function useRemoveLinkFromCollection(id: string) {
  const invalidate = useInvalidateCollections();
  return useMutation({ mutationFn: (linkId: string) => collectionsApi.removeLink(id, linkId), onSuccess: () => invalidate(id) });
}

export function useReorderCollection(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: string[]) => collectionsApi.reorder(id, order),
    onMutate: async (order) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.collections.detail(id) });
      const previous = queryClient.getQueryData<Collection>(queryKeys.collections.detail(id));
      if (previous?.items) {
        const byId = new Map(previous.items.map((l) => [l.public_id, l]));
        queryClient.setQueryData(queryKeys.collections.detail(id), {
          ...previous,
          items: order.map((pid) => byId.get(pid)).filter(Boolean),
        });
      }
      return { previous };
    },
    onError: (_e, _o, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKeys.collections.detail(id), ctx.previous);
    },
  });
}
