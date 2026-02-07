import { requireApiSession } from '@/app/lib/auth/session';
import {
  deleteBonusRule,
  getBonusRule,
  getPersona,
  updateBonusRule,
} from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam, parseJsonBody } from '@/app/lib/server/http';
import { updateBonusSchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';

interface RouteContext {
  params: Promise<{
    personaId: string;
    bonusId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { personaId, bonusId } = await context.params;
    const resolvedPersonaId = parseIdParam(personaId, 'personaId');
    const resolvedBonusId = parseIdParam(bonusId, 'bonusId');

    const persona = await getPersona(session.user.id, resolvedPersonaId);
    if (!persona) {
      throw new ApiError(404, 'NOT_FOUND', 'Persona not found');
    }

    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(updateBonusSchema, body);
    const bonus = await updateBonusRule(resolvedPersonaId, resolvedBonusId, payload);

    if (!bonus) {
      throw new ApiError(404, 'NOT_FOUND', 'Bonus rule not found');
    }

    return jsonOk({ bonus });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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

    await deleteBonusRule(resolvedPersonaId, resolvedBonusId);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
