'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/lib/services/query-keys';
import { fetchProfileDashboard } from '@/app/lib/services/profile-service';

export function useProfileDashboard(personaId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile.dashboard(personaId),
    queryFn: () => fetchProfileDashboard(personaId),
    enabled,
  });
}
