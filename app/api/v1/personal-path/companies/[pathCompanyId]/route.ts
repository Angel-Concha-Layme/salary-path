import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  deletePathCompany,
  getPathCompanyById,
  updatePathCompany,
} from "@/app/lib/server/domain/personal-path/path-companies.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

interface RouteParams {
  pathCompanyId: string
}

export async function GET(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { pathCompanyId } = await context.params
    const result = await getPathCompanyById(session.user.id, pathCompanyId)

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
    const { pathCompanyId } = await context.params
    const payload = await request.json()
    const result = await updatePathCompany(session.user.id, pathCompanyId, payload)

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
    const { pathCompanyId } = await context.params
    const result = await deletePathCompany(session.user.id, pathCompanyId)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
