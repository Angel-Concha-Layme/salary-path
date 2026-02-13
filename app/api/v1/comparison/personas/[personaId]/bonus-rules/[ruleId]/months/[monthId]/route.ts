import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  deletePersonaBonusRuleMonth,
  getPersonaBonusRuleMonthById,
  updatePersonaBonusRuleMonth,
} from "@/app/lib/server/domain/comparison/persona-bonus-rule-months.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

interface RouteParams {
  personaId: string
  ruleId: string
  monthId: string
}

export async function GET(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { personaId, ruleId, monthId } = await context.params
    const result = await getPersonaBonusRuleMonthById(session.user.id, personaId, ruleId, monthId)

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
    const { personaId, ruleId, monthId } = await context.params
    const payload = await request.json()
    const result = await updatePersonaBonusRuleMonth(
      session.user.id,
      personaId,
      ruleId,
      monthId,
      payload
    )

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
    const { personaId, ruleId, monthId } = await context.params
    const result = await deletePersonaBonusRuleMonth(session.user.id, personaId, ruleId, monthId)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
