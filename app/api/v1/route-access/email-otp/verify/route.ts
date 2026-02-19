import { routeAccessVerifyRequestSchema } from "@/app/lib/models/security/route-access.model"
import { ApiError } from "@/app/lib/server/api-error"
import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import { verifyRouteEmailOtpForUser } from "@/app/lib/server/domain/security/route-email-otp.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request)
    const payload = await request.json()
    const parsed = routeAccessVerifyRequestSchema.safeParse(payload)

    if (!parsed.success) {
      throw new ApiError(400, "BAD_REQUEST", parsed.error.issues[0]?.message ?? "Invalid payload")
    }

    const result = await verifyRouteEmailOtpForUser({
      ownerUserId: session.user.id,
      routeKey: parsed.data.routeKey,
      code: parsed.data.code,
    })

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

