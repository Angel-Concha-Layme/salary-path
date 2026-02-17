import { jsonError, jsonOkWithoutNulls } from "@/app/lib/server/api-response"
import {
  createUserFinanceSettings,
  listUserFinanceSettings,
} from "@/app/lib/server/domain/settings/user-finance-settings.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request)
    const searchParams = new URL(request.url).searchParams
    const requestedLimit = Number(searchParams.get("limit") ?? 50)

    const result = await listUserFinanceSettings(session.user.id, {
      limit: requestedLimit,
    })

    return jsonOkWithoutNulls(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request)
    const payload = await request.json()
    const result = await createUserFinanceSettings(session.user.id, payload)

    return jsonOkWithoutNulls(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
