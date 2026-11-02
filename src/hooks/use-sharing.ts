'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sharingApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import type { SharedListParams } from '@/lib/api/types';

export function useInvitations(linkId: string, enabled = true) {
  return useQuery({ queryKey: queryKeys.sharing.invitations(linkId), queryFn: () => sharingApi.invitations(linkId), enabled });
}

export function useAccessGraph(linkId: string, enabled = true) {
  return useQuery({ queryKey: queryKeys.sharing.access(linkId), queryFn: () => sharingApi.access(linkId), enabled });
}

export function useSharingMutations(linkId: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sharing.invitations(linkId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sharing.access(linkId) });
  };
  const invite = useMutation({ mutationFn: (email: string) => sharingApi.invite(linkId, email), onSuccess: refresh });
  const revokeInvitation = useMutation({ mutationFn: (id: string) => sharingApi.revokeInvitation(linkId, id), onSuccess: refresh });
  const revokeGrant = useMutation({ mutationFn: (id: string) => sharingApi.revokeGrant(linkId, id), onSuccess: refresh });
  return { invite, revokeInvitation, revokeGrant };
}

export function useSharedWithMe(params: SharedListParams) {
  return useQuery({
    queryKey: queryKeys.sharing.sharedWithMe(params),
    queryFn: ({ signal }) => sharingApi.sharedWithMe(params, signal),
    placeholderData: (prev) => prev,
  });
}

export function useReceivedInvitations() {
  return useQuery({ queryKey: queryKeys.sharing.received, queryFn: () => sharingApi.received() });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => sharingApi.acceptById(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharing.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
