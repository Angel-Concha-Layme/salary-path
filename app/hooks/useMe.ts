'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/lib/services/query-keys';
import { fetchMe, type MeResponse } from '@/app/lib/services/me-service';

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    enabled,
    staleTime: 15 * 60 * 1000,
    retry: false,
  });
}

export function useInvalidateMe() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.me });
}

export function useSetMeData() {
  const queryClient = useQueryClient();
  return (data: MeResponse) => queryClient.setQueryData(queryKeys.me, data);
}
