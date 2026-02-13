import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  deleteCompanyCatalog,
  getCompanyCatalogById,
  updateCompanyCatalog,
} from "@/app/lib/server/domain/companies/company-catalog.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

interface RouteParams {
  companyId: string
}

export async function GET(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { companyId } = await context.params
    const result = await getCompanyCatalogById(session.user.id, companyId)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { companyId } = await context.params
    const payload = await request.json()
    const result = await updateCompanyCatalog(session.user.id, companyId, payload)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { companyId } = await context.params
    const result = await deleteCompanyCatalog(session.user.id, companyId)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
