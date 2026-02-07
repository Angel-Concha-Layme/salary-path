import { requireApiSession } from '@/app/lib/auth/session';
import {
  deletePersonaEvent,
  getPersona,
  getPersonaEvent,
  updatePersonaEvent,
} from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam, parseJsonBody } from '@/app/lib/server/http';
import { updatePersonaEventSchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';

interface RouteContext {
  params: Promise<{
    personaId: string;
    eventId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { personaId, eventId } = await context.params;
    const resolvedPersonaId = parseIdParam(personaId, 'personaId');
    const resolvedEventId = parseIdParam(eventId, 'eventId');

    const persona = await getPersona(session.user.id, resolvedPersonaId);
    if (!persona) {
      throw new ApiError(404, 'NOT_FOUND', 'Persona not found');
    }

    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(updatePersonaEventSchema, body);
    const event = await updatePersonaEvent(resolvedPersonaId, resolvedEventId, payload);

    if (!event) {
      throw new ApiError(404, 'NOT_FOUND', 'Event not found');
    }

    return jsonOk({ event });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { personaId, eventId } = await context.params;
    const resolvedPersonaId = parseIdParam(personaId, 'personaId');
    const resolvedEventId = parseIdParam(eventId, 'eventId');

    const persona = await getPersona(session.user.id, resolvedPersonaId);
    if (!persona) {
      throw new ApiError(404, 'NOT_FOUND', 'Persona not found');
    }

    const event = await getPersonaEvent(resolvedPersonaId, resolvedEventId);
    if (!event) {
      throw new ApiError(404, 'NOT_FOUND', 'Event not found');
    }

    await deletePersonaEvent(resolvedPersonaId, resolvedEventId);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
