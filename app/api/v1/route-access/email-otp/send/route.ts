import { routeAccessSendRequestSchema } from "@/app/lib/models/security/route-access.model"
import { ApiError } from "@/app/lib/server/api-error"
import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import { sendRouteEmailOtpForUser } from "@/app/lib/server/domain/security/route-email-otp.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

function readRequestIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null
  }

  return request.headers.get("x-real-ip") || null
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request)
    const payload = await request.json()
    const parsed = routeAccessSendRequestSchema.safeParse(payload)

    if (!parsed.success) {
      throw new ApiError(400, "BAD_REQUEST", parsed.error.issues[0]?.message ?? "Invalid payload")
    }

    const result = await sendRouteEmailOtpForUser({
      ownerUserId: session.user.id,
      email: session.user.email,
      routeKey: parsed.data.routeKey,
      ipAddress: readRequestIp(request),
      userAgent: request.headers.get("user-agent"),
    })

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

