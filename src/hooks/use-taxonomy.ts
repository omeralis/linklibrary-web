'use client';

import { useQuery } from '@tanstack/react-query';
import { publicApi, taxonomyApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';

export function useCategories(enabled = true) {
  return useQuery({ queryKey: queryKeys.taxonomy.categories, queryFn: () => taxonomyApi.categories(), staleTime: 10 * 60_000, enabled });
}

export function usePublicCategories() {
  return useQuery({ queryKey: queryKeys.public.categories, queryFn: () => publicApi.categories(), staleTime: 5 * 60_000 });
}

export function useTagSuggestions(q: string, enabled = true) {
  return useQuery({ queryKey: queryKeys.taxonomy.tags(q), queryFn: () => taxonomyApi.tags(q || undefined), staleTime: 60_000, enabled });
}
