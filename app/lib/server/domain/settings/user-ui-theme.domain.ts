import { eq } from "drizzle-orm"
import { z } from "zod"

import {
  coerceUiThemeControlsStyle,
  coerceUiThemePresetKey,
  isUiThemeControlsStyle,
  isUiThemePresetKey,
} from "@/app/lib/features/ui-theme-preset"
import type {
  UserUiThemeResponse,
  UserUiThemeUpdateInput,
} from "@/app/lib/models/settings/user-ui-theme.model"
import { db } from "@/app/lib/db/client"
import { user } from "@/app/lib/db/schema"
import { ApiError } from "@/app/lib/server/api-error"
import { toIso } from "@/app/lib/server/domain/common"

const updateSchema = z.object({
  themePresetKey: z.string().refine(isUiThemePresetKey, {
    message: "Invalid theme preset key",
  }),
  controlsStyle: z.string().refine(isUiThemeControlsStyle, {
    message: "Invalid controls style",
  }),
})

function mapEntity(row: {
  uiThemePreset: string
  uiControlsStyle: string
  updatedAt: Date | null
}): UserUiThemeResponse {
  return {
    themePresetKey: coerceUiThemePresetKey(row.uiThemePreset),
    controlsStyle: coerceUiThemeControlsStyle(row.uiControlsStyle),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
  }
}

export async function getUserUiTheme(ownerUserId: string): Promise<UserUiThemeResponse> {
  const rows = await db
    .select({
      uiThemePreset: user.uiThemePreset,
      uiControlsStyle: user.uiControlsStyle,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, ownerUserId))
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "User not found")
  }

  return mapEntity(row)
}

export async function updateUserUiTheme(
  ownerUserId: string,
  input: UserUiThemeUpdateInput
): Promise<UserUiThemeResponse> {
  const payload = updateSchema.parse(input)

  const rows = await db
    .update(user)
    .set({
      uiThemePreset: payload.themePresetKey,
      uiControlsStyle: payload.controlsStyle,
      updatedAt: new Date(),
    })
    .where(eq(user.id, ownerUserId))
    .returning({
      uiThemePreset: user.uiThemePreset,
      uiControlsStyle: user.uiControlsStyle,
      updatedAt: user.updatedAt,
    })

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "User not found")
  }

  return mapEntity(row)
}
