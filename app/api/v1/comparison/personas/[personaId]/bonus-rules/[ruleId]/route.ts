import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  deletePersonaBonusRule,
  getPersonaBonusRuleById,
  updatePersonaBonusRule,
} from "@/app/lib/server/domain/comparison/persona-bonus-rules.domain"
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
    const result = await getPersonaBonusRuleById(session.user.id, personaId, ruleId)

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
    const { personaId, ruleId } = await context.params
    const payload = await request.json()
    const result = await updatePersonaBonusRule(session.user.id, personaId, ruleId, payload)

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
    const { personaId, ruleId } = await context.params
    const result = await deletePersonaBonusRule(session.user.id, personaId, ruleId)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
