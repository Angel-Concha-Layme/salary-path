import { requireApiSession } from '@/app/lib/auth/session';
import { deleteCompany, getCompany, updateCompany } from '@/app/lib/server/domain-service';
import { ApiError, jsonError, jsonOk, parseIdParam, parseJsonBody } from '@/app/lib/server/http';
import { updateCompanySchema } from '@/app/lib/server/validation';
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

    return jsonOk({ company });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { companyId } = await context.params;
    const id = parseIdParam(companyId, 'companyId');

    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(updateCompanySchema, body);

    const company = await updateCompany(session.user.id, id, payload);
    if (!company) {
      throw new ApiError(404, 'NOT_FOUND', 'Company not found');
    }

    return jsonOk({ company });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession(request.headers);
    const { companyId } = await context.params;
    const id = parseIdParam(companyId, 'companyId');

    const company = await getCompany(session.user.id, id);
    if (!company) {
      throw new ApiError(404, 'NOT_FOUND', 'Company not found');
    }

    await deleteCompany(session.user.id, id);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
