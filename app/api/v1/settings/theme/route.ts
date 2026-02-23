import { jsonError, jsonOkWithoutNulls } from "@/app/lib/server/api-response"
import {
  getUserUiTheme,
  updateUserUiTheme,
} from "@/app/lib/server/domain/settings/user-ui-theme.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request)
    const result = await getUserUiTheme(session.user.id)

    return jsonOkWithoutNulls(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiSession(request)
    const payload = await request.json()
    const result = await updateUserUiTheme(session.user.id, payload)

    return jsonOkWithoutNulls(result)
  } catch (error) {
    return jsonError(error)
  }
}
