'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/lib/services/query-keys';
import { fetchSettings, updateSettings, type SettingsPatch } from '@/app/lib/services/settings-service';

export function useSettings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: fetchSettings,
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SettingsPatch) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.path.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.comparison.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}
