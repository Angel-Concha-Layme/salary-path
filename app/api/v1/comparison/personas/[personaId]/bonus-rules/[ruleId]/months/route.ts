import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  createPersonaBonusRuleMonth,
  listPersonaBonusRuleMonths,
} from "@/app/lib/server/domain/comparison/persona-bonus-rule-months.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

interface RouteParams {
  personaId: string
  ruleId: string
}

export async function GET(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { personaId, ruleId } = await context.params
    const searchParams = new URL(request.url).searchParams
    const requestedLimit = Number(searchParams.get("limit") ?? 50)

    const result = await listPersonaBonusRuleMonths(session.user.id, personaId, ruleId, {
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
    const { personaId, ruleId } = await context.params
    const payload = await request.json()
    const result = await createPersonaBonusRuleMonth(session.user.id, personaId, ruleId, payload)

    return jsonOk(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
