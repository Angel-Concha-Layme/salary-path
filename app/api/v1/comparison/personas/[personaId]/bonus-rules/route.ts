import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  createPersonaBonusRule,
  listPersonaBonusRules,
} from "@/app/lib/server/domain/comparison/persona-bonus-rules.domain"
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

    const result = await listPersonaBonusRules(session.user.id, personaId, {
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
    const result = await createPersonaBonusRule(session.user.id, personaId, payload)

    return jsonOk(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
