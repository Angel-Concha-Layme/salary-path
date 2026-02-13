import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import { listPathCompanyEventsByOwner } from "@/app/lib/server/domain/personal-path/path-company-events.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request)
    const searchParams = new URL(request.url).searchParams
    const requestedLimit = Number(searchParams.get("limit") ?? 500)

    const result = await listPathCompanyEventsByOwner(session.user.id, {
      limit: requestedLimit,
    })

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
