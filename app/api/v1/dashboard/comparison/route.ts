import { requireApiSession } from '@/app/lib/auth/session';
import { buildRatesData } from '@/app/lib/server/domain-service';
import { jsonError, jsonOk } from '@/app/lib/server/http';
import { dashboardComparisonQuerySchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';
import { deriveDashboardAnalytics } from '@/app/lib/rates-engine';

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
    const query = parseOrThrow(dashboardComparisonQuerySchema, searchParams);

    const data = await buildRatesData(session.user.id);
    const selectedPersonIds = query.selectedPersonaIds
      ? query.selectedPersonaIds
          .split(',')
          .map((value) => Number.parseInt(value.trim(), 10))
          .filter((value) => Number.isFinite(value))
      : data.people.map((person) => person.id);

    const analytics = deriveDashboardAnalytics({
      meta: data.meta,
      people: data.people,
      selectedPersonIds,
      comparisonMode: query.comparisonMode ?? 'calendar',
      metricMode: query.metricMode ?? 'rate',
      cutoffDate: query.cutoffDate,
      projectionYears: query.projectionYears,
      projectionAnnualRaise: query.projectionAnnualRaise,
      includeBonuses: query.includeBonuses ?? false,
    });

    return jsonOk({
      data,
      analytics,
    });
  } catch (error) {
    return jsonError(error);
  }
}
