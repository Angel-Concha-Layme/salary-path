import { requireApiSession } from '@/app/lib/auth/session';
import { buildPathData } from '@/app/lib/server/domain-service';
import { jsonError, jsonOk } from '@/app/lib/server/http';
import { derivePathDashboardAnalyticsFromData } from '@/app/lib/path-engine';

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const searchParams = new URL(request.url).searchParams;
    const metricMode = searchParams.get('metricMode') === 'income' ? 'income' : 'normalized_rate';
    const cutoffDate = searchParams.get('cutoffDate') ?? undefined;

    const data = await buildPathData(session.user.id);
    const analytics = derivePathDashboardAnalyticsFromData(data, metricMode, cutoffDate);

    return jsonOk({
      data,
      analytics,
    });
  } catch (error) {
    return jsonError(error);
  }
}
