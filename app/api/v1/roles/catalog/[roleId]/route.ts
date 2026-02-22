import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  deleteRoleCatalog,
  getRoleCatalogById,
  updateRoleCatalog,
} from "@/app/lib/server/domain/roles/role-catalog.domain"
import { requireApiAdminSession } from "@/app/lib/server/require-api-admin-session"
import { requireApiSession } from "@/app/lib/server/require-api-session"

interface RouteParams {
  roleId: string
}

export async function GET(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    await requireApiSession(request)
    const { roleId } = await context.params
    const result = await getRoleCatalogById(roleId)

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
    const { roleId } = await context.params
    const payload = await request.json()
    const result = await updateRoleCatalog(roleId, payload)

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
    const { roleId } = await context.params
    const result = await deleteRoleCatalog(roleId)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
