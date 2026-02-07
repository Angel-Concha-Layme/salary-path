import { requireApiSession } from '@/app/lib/auth/session';
import { createPersona, listPersonas } from '@/app/lib/server/domain-service';
import { jsonError, jsonOk, parseJsonBody } from '@/app/lib/server/http';
import { createPersonaSchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const personas = await listPersonas(session.user.id);
    return jsonOk({ personas });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(createPersonaSchema, body);
    const persona = await createPersona(session.user.id, payload);
    return jsonOk({ persona }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
