import { requireApiSession } from '@/app/lib/auth/session';
import {
  getBonusRule,
  getPersona,
  replaceBonusMonths,
} from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam, parseJsonBody } from '@/app/lib/server/http';
import { replaceBonusMonthsSchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';

interface RouteContext {
  params: Promise<{
    personaId: string;
    bonusId: string;
  }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { personaId, bonusId } = await context.params;
    const resolvedPersonaId = parseIdParam(personaId, 'personaId');
    const resolvedBonusId = parseIdParam(bonusId, 'bonusId');

    const persona = await getPersona(session.user.id, resolvedPersonaId);
    if (!persona) {
      throw new ApiError(404, 'NOT_FOUND', 'Persona not found');
    }

    const bonus = await getBonusRule(resolvedPersonaId, resolvedBonusId);
    if (!bonus) {
      throw new ApiError(404, 'NOT_FOUND', 'Bonus rule not found');
    }

    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(replaceBonusMonthsSchema, body);
    const updated = await replaceBonusMonths(resolvedPersonaId, resolvedBonusId, payload.months);

    return jsonOk({ bonus: updated });
  } catch (error) {
    return jsonError(error);
  }
}
