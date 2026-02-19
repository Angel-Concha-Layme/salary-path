import { routeAccessStatusQuerySchema } from "@/app/lib/models/security/route-access.model"
import { ApiError } from "@/app/lib/server/api-error"
import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import { getRouteAccessStatusForUser } from "@/app/lib/server/domain/security/route-email-otp.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request)
    const searchParams = new URL(request.url).searchParams
    const parsed = routeAccessStatusQuerySchema.safeParse({
      routeKey: searchParams.get("routeKey"),
    })

    if (!parsed.success) {
      throw new ApiError(400, "BAD_REQUEST", parsed.error.issues[0]?.message ?? "Invalid route key")
    }

    const result = await getRouteAccessStatusForUser(session.user.id, parsed.data.routeKey)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

