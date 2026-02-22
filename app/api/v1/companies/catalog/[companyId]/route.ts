import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  deleteCompanyCatalog,
  getCompanyCatalogById,
  updateCompanyCatalog,
} from "@/app/lib/server/domain/companies/company-catalog.domain"
import { requireApiAdminSession } from "@/app/lib/server/require-api-admin-session"
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
    await requireApiSession(request)
    const { companyId } = await context.params
    const result = await getCompanyCatalogById(companyId)

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
    await requireApiAdminSession(request)
    const { companyId } = await context.params
    const payload = await request.json()
    const result = await updateCompanyCatalog(companyId, payload)

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
    await requireApiAdminSession(request)
    const { companyId } = await context.params
    const result = await deleteCompanyCatalog(companyId)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
