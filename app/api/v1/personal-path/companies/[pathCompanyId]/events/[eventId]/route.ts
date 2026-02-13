import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  deletePathCompanyEvent,
  getPathCompanyEventById,
  updatePathCompanyEvent,
} from "@/app/lib/server/domain/personal-path/path-company-events.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

interface RouteParams {
  pathCompanyId: string
  eventId: string
}

export async function GET(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { pathCompanyId, eventId } = await context.params
    const result = await getPathCompanyEventById(session.user.id, pathCompanyId, eventId)

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
    const { pathCompanyId, eventId } = await context.params
    const payload = await request.json()
    const result = await updatePathCompanyEvent(session.user.id, pathCompanyId, eventId, payload)

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
    const { pathCompanyId, eventId } = await context.params
    const result = await deletePathCompanyEvent(session.user.id, pathCompanyId, eventId)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
