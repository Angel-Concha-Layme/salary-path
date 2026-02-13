import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  createPersonaCareerEvent,
  listPersonaCareerEvents,
} from "@/app/lib/server/domain/comparison/persona-career-events.domain"
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
    const searchParams = new URL(request.url).searchParams
    const requestedLimit = Number(searchParams.get("limit") ?? 50)

    const result = await listPersonaCareerEvents(session.user.id, personaId, {
      limit: requestedLimit,
    })

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { personaId } = await context.params
    const payload = await request.json()
    const result = await createPersonaCareerEvent(session.user.id, personaId, payload)

    return jsonOk(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
