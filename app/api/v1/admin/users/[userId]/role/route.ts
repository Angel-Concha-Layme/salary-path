import { requireApiAdminSession } from '@/app/lib/auth/session';
import { updateUserRole } from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam, parseJsonBody } from '@/app/lib/server/http';
import { adminRoleUpdateSchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';

interface RouteContext {
  params: Promise<{
    userId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiAdminSession(request.headers);
    if ((session.user.role ?? 'user') !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Admin role required');
    }

    const { userId } = await context.params;
    const resolvedUserId = parseIdParam(userId, 'userId');
    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(adminRoleUpdateSchema, body);

    const updated = await updateUserRole(resolvedUserId, payload.role);

    if (!updated) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    return jsonOk({ user: updated });
  } catch (error) {
    return jsonError(error);
  }
}
