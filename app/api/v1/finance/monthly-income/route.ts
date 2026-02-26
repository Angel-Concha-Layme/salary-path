import { jsonError, jsonOkWithoutNulls } from "@/app/lib/server/api-response"
import { listMonthlyIncomeByRange } from "@/app/lib/server/domain/finance/monthly-income.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request)
    const searchParams = new URL(request.url).searchParams
    const range = searchParams.get("range") ?? undefined

    const result = await listMonthlyIncomeByRange(session.user.id, range)

    return jsonOkWithoutNulls(result)
  } catch (error) {
    return jsonError(error)
  }
}
