import { requireApiSession } from '@/app/lib/auth/session';
import { getSettings, upsertSettings } from '@/app/lib/server/domain-service';
import { jsonError, jsonOk, parseJsonBody } from '@/app/lib/server/http';
import { settingsPatchSchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const settings = await getSettings(session.user.id);

    return jsonOk({
      settings,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(settingsPatchSchema, body);

    const settings = await upsertSettings(session.user.id, payload);

    return jsonOk({ settings });
  } catch (error) {
    return jsonError(error);
  }
}
