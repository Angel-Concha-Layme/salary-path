'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/lib/services/query-keys';
import { fetchPathDashboard } from '@/app/lib/services/path-service';

export function usePathDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.path.dashboard(),
    queryFn: fetchPathDashboard,
    enabled,
  });
}
