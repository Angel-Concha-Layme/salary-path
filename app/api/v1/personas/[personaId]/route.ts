import { requireApiSession } from '@/app/lib/auth/session';
import {
  deletePersona,
  getPersona,
  updatePersona,
} from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam, parseJsonBody } from '@/app/lib/server/http';
import { updatePersonaSchema } from '@/app/lib/server/validation';
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

    return jsonOk({ persona });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { personaId } = await context.params;
    const id = parseIdParam(personaId, 'personaId');
    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(updatePersonaSchema, body);

    const persona = await updatePersona(session.user.id, id, payload);

    if (!persona) {
      throw new ApiError(404, 'NOT_FOUND', 'Persona not found');
    }

    return jsonOk({ persona });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { personaId } = await context.params;
    const id = parseIdParam(personaId, 'personaId');

    const persona = await getPersona(session.user.id, id);
    if (!persona) {
      throw new ApiError(404, 'NOT_FOUND', 'Persona not found');
    }

    await deletePersona(session.user.id, id);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
