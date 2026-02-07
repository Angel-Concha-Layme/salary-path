import { requireApiSession } from '@/app/lib/auth/session';
import {
  createPersonaEvent,
  getPersona,
  listPersonaEvents,
} from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam, parseJsonBody } from '@/app/lib/server/http';
import { createPersonaEventSchema } from '@/app/lib/server/validation';
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

    const events = await listPersonaEvents(id);
    return jsonOk({ events });
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
    const payload = parseOrThrow(createPersonaEventSchema, body);

    const event = await createPersonaEvent(id, payload);
    return jsonOk({ event }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
