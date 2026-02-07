import { requireApiSession } from '@/app/lib/auth/session';
import {
  deleteCompanyEvent,
  getCompany,
  getCompanyEvent,
  updateCompanyEvent,
} from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam, parseJsonBody } from '@/app/lib/server/http';
import { updateCompanyEventSchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';

interface RouteContext {
  params: Promise<{
    companyId: string;
    eventId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { companyId, eventId } = await context.params;
    const resolvedCompanyId = parseIdParam(companyId, 'companyId');
    const resolvedEventId = parseIdParam(eventId, 'eventId');

    const company = await getCompany(session.user.id, resolvedCompanyId);
    if (!company) {
      throw new ApiError(404, 'NOT_FOUND', 'Company not found');
    }

    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(updateCompanyEventSchema, body);
    const event = await updateCompanyEvent(resolvedCompanyId, resolvedEventId, payload);

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
    const { companyId, eventId } = await context.params;
    const resolvedCompanyId = parseIdParam(companyId, 'companyId');
    const resolvedEventId = parseIdParam(eventId, 'eventId');

    const company = await getCompany(session.user.id, resolvedCompanyId);
    if (!company) {
      throw new ApiError(404, 'NOT_FOUND', 'Company not found');
    }

    const event = await getCompanyEvent(resolvedCompanyId, resolvedEventId);
    if (!event) {
      throw new ApiError(404, 'NOT_FOUND', 'Event not found');
    }

    await deleteCompanyEvent(resolvedCompanyId, resolvedEventId);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
