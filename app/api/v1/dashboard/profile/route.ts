import { requireApiSession } from '@/app/lib/auth/session';
import { buildProfileData } from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk } from '@/app/lib/server/http';
import { dashboardProfileQuerySchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';
import { deriveProfileAnalytics } from '@/app/lib/profile-engine';

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
    const query = parseOrThrow(dashboardProfileQuerySchema, searchParams);

    const data = await buildProfileData(session.user.id, query.personaId);
    if (!data) {
      throw new ApiError(404, 'NOT_FOUND', 'No profile data found for this user');
    }

    const analytics = deriveProfileAnalytics(data, query.cutoffDate);

    return jsonOk({
      data,
      analytics,
    });
  } catch (error) {
    return jsonError(error);
  }
}
