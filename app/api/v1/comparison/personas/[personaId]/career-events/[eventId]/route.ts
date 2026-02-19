import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  deletePersonaCareerEvent,
  getPersonaCareerEventById,
  updatePersonaCareerEvent,
} from "@/app/lib/server/domain/comparison/persona-career-events.domain"
import { requireApiRouteAccess } from "@/app/lib/server/require-api-route-access"

interface RouteParams {
  personaId: string
  eventId: string
}

export async function GET(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiRouteAccess(request, "comparison")
    const { personaId, eventId } = await context.params
    const result = await getPersonaCareerEventById(session.user.id, personaId, eventId)

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
    const session = await requireApiRouteAccess(request, "comparison")
    const { personaId, eventId } = await context.params
    const payload = await request.json()
    const result = await updatePersonaCareerEvent(session.user.id, personaId, eventId, payload)

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
    const session = await requireApiRouteAccess(request, "comparison")
    const { personaId, eventId } = await context.params
    const result = await deletePersonaCareerEvent(session.user.id, personaId, eventId)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
