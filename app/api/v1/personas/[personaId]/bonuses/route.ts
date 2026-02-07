import { requireApiSession } from '@/app/lib/auth/session';
import {
  createBonusRule,
  getPersona,
  listBonusRules,
} from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam, parseJsonBody } from '@/app/lib/server/http';
import { createBonusSchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';

interface RouteContext {
  params: Promise<{
    personaId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { personaId } = await context.params;
    const id = parseIdParam(personaId, 'personaId');

    const persona = await getPersona(session.user.id, id);
    if (!persona) {
      throw new ApiError(404, 'NOT_FOUND', 'Persona not found');
    }

    const bonuses = await listBonusRules(id);
    return jsonOk({ bonuses });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { personaId } = await context.params;
    const id = parseIdParam(personaId, 'personaId');

    const persona = await getPersona(session.user.id, id);
    if (!persona) {
      throw new ApiError(404, 'NOT_FOUND', 'Persona not found');
    }

    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(createBonusSchema, body);

    const bonus = await createBonusRule(id, payload);
    return jsonOk({ bonus }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
