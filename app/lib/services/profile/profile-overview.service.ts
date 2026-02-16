import type { ProfileOverviewResponse } from "@/app/lib/models/profile/profile-overview.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface GetProfileOverviewOptions {
  signal?: AbortSignal
}

async function getProfileOverview(options: GetProfileOverviewOptions = {}) {
  return apiClient.get<ProfileOverviewResponse>("/profile/overview", {
    signal: options.signal,
  })
}

export const profileOverviewService = {
  getProfileOverview,
}
