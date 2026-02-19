import { assertRouteAccessForUser } from "@/app/lib/server/domain/security/route-email-otp.domain"
import { requireApiSession, type ApiSessionContext } from "@/app/lib/server/require-api-session"
import type { RouteStepUpKey } from "@/app/lib/security/route-protection-config"

export async function requireApiRouteAccess(
  request: Request,
  routeKey: RouteStepUpKey
): Promise<ApiSessionContext> {
  const session = await requireApiSession(request)
  await assertRouteAccessForUser(session.user.id, routeKey)

  return session
}

