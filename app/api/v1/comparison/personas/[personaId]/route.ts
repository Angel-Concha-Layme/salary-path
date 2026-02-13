import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  deleteComparisonPersona,
  getComparisonPersonaById,
  updateComparisonPersona,
} from "@/app/lib/server/domain/comparison/comparison-personas.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

interface RouteParams {
  personaId: string
}

export async function GET(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { personaId } = await context.params
    const result = await getComparisonPersonaById(session.user.id, personaId)

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
    const { personaId } = await context.params
    const payload = await request.json()
    const result = await updateComparisonPersona(session.user.id, personaId, payload)

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
    const { personaId } = await context.params
    const result = await deleteComparisonPersona(session.user.id, personaId)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
