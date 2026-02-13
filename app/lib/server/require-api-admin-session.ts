import { hasAdminRole } from "@/app/lib/auth/roles"
import { ApiError } from "@/app/lib/server/api-error"
import {
  type ApiSessionContext,
  requireApiSession,
} from "@/app/lib/server/require-api-session"

export async function requireApiAdminSession(
  request: Request
): Promise<ApiSessionContext> {
  const session = await requireApiSession(request)

  if (!hasAdminRole(session.user.role)) {
    throw new ApiError(403, "FORBIDDEN", "Admin permissions required")
  }

  return session
}
