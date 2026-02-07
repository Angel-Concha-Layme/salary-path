import { requireApiAdminSession } from '@/app/lib/auth/session';
import { getAdminSnapshot } from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam } from '@/app/lib/server/http';

interface RouteContext {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireApiAdminSession(request.headers);
    if ((session.user.role ?? 'user') !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Admin role required');
    }

    const { userId } = await context.params;
    const ownerUserId = parseIdParam(userId, 'userId');
    const snapshot = await getAdminSnapshot(ownerUserId);

    return jsonOk({ snapshot });
  } catch (error) {
    return jsonError(error);
  }
}
