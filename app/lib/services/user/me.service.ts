import type { MeResponse } from "@/app/lib/models/user/user.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface GetMeOptions {
  signal?: AbortSignal
}

async function getMe(options: GetMeOptions = {}) {
  return apiClient.get<MeResponse>("/me", {
    signal: options.signal,
  })
}

export const meService = {
  getMe,
}
