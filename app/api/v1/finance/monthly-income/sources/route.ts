import { jsonError, jsonOkWithoutNulls } from "@/app/lib/server/api-response"
import { createMonthlyIncomeSource } from "@/app/lib/server/domain/finance/monthly-income.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request)
    const payload = await request.json()
    const result = await createMonthlyIncomeSource(session.user.id, payload)

    return jsonOkWithoutNulls(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
