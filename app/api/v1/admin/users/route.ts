import { requireApiAdminSession } from '@/app/lib/auth/session';
import { listUsersForAdmin } from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk } from '@/app/lib/server/http';

export async function GET(request: Request) {
  try {
    const session = await requireApiAdminSession(request.headers);
    if ((session.user.role ?? 'user') !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Admin role required');
    }

    const users = await listUsersForAdmin();
    return jsonOk({ users });
  } catch (error) {
    return jsonError(error);
  }
}
