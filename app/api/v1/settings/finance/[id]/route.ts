import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  deleteUserFinanceSettings,
  getUserFinanceSettingsById,
  updateUserFinanceSettings,
} from "@/app/lib/server/domain/settings/user-finance-settings.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

interface RouteParams {
  id: string
}

export async function GET(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { id } = await context.params
    const result = await getUserFinanceSettingsById(session.user.id, id)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { id } = await context.params
    const payload = await request.json()
    const result = await updateUserFinanceSettings(session.user.id, id, payload)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { id } = await context.params
    const result = await deleteUserFinanceSettings(session.user.id, id)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
