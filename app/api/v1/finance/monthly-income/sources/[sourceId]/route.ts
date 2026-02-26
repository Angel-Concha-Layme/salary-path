import { jsonError, jsonOkWithoutNulls } from "@/app/lib/server/api-response"
import {
  deleteMonthlyIncomeSource,
  updateMonthlyIncomeSource,
} from "@/app/lib/server/domain/finance/monthly-income.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

interface RouteParams {
  sourceId: string
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { sourceId } = await context.params
    const payload = await request.json()
    const result = await updateMonthlyIncomeSource(session.user.id, sourceId, payload)

    return jsonOkWithoutNulls(result)
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
    const { sourceId } = await context.params
    const result = await deleteMonthlyIncomeSource(session.user.id, sourceId)

    return jsonOkWithoutNulls(result)
  } catch (error) {
    return jsonError(error)
  }
}
