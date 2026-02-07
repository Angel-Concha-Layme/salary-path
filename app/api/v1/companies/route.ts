import { requireApiSession } from '@/app/lib/auth/session';
import { createCompany, listCompanies } from '@/app/lib/server/domain-service';
import { jsonError, jsonOk, parseJsonBody } from '@/app/lib/server/http';
import { createCompanySchema } from '@/app/lib/server/validation';
import { parseOrThrow } from '@/app/lib/server/validation-error';

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const companies = await listCompanies(session.user.id);
    return jsonOk({ companies });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request.headers);
    const body = await parseJsonBody<unknown>(request);
    const payload = parseOrThrow(createCompanySchema, body);
    const company = await createCompany(session.user.id, payload);
    return jsonOk({ company }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
