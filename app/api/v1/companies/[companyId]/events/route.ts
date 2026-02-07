import { requireApiSession } from '@/app/lib/auth/session';
import {
  createCompanyEvent,
  getCompany,
  listCompanyEvents,
} from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam, parseJsonBody } from '@/app/lib/server/http';
import { createCompanyEventSchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';

interface RouteContext {
  params: Promise<{
    companyId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { companyId } = await context.params;
    const id = parseIdParam(companyId, 'companyId');

    const company = await getCompany(session.user.id, id);
    if (!company) {
      throw new ApiError(404, 'NOT_FOUND', 'Company not found');
    }

    const events = await listCompanyEvents(id);
    return jsonOk({ events });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { companyId } = await context.params;
    const id = parseIdParam(companyId, 'companyId');

    const company = await getCompany(session.user.id, id);
    if (!company) {
      throw new ApiError(404, 'NOT_FOUND', 'Company not found');
    }

    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(createCompanyEventSchema, body);
    const event = await createCompanyEvent(id, payload);
    return jsonOk({ event }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
