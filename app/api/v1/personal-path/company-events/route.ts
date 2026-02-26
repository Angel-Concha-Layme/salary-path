import { jsonError, jsonOkWithoutNulls } from "@/app/lib/server/api-response"
import { listPathCompanyEventsByOwner } from "@/app/lib/server/domain/personal-path/path-company-events.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request)
    const result = await listPathCompanyEventsByOwner(session.user.id)

    return jsonOkWithoutNulls(result)
  } catch (error) {
    return jsonError(error)
  }
}
