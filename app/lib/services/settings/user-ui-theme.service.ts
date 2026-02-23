import type {
  UserUiThemeResponse,
  UserUiThemeUpdateInput,
} from "@/app/lib/models/settings/user-ui-theme.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface GetUserUiThemeOptions {
  signal?: AbortSignal
}

export interface UpdateUserUiThemeOptions {
  signal?: AbortSignal
}

async function getUserUiTheme(options: GetUserUiThemeOptions = {}) {
  return apiClient.get<UserUiThemeResponse>("/settings/theme", {
    signal: options.signal,
  })
}

async function updateUserUiTheme(
  input: UserUiThemeUpdateInput,
  options: UpdateUserUiThemeOptions = {}
) {
  return apiClient.patch<UserUiThemeResponse>("/settings/theme", {
    json: input,
    signal: options.signal,
  })
}

export const userUiThemeService = {
  getUserUiTheme,
  updateUserUiTheme,
}
