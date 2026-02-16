import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import { getProfileOverview } from "@/app/lib/server/domain/profile/profile-overview.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request)
    const result = await getProfileOverview(session.user.id, session.source)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
