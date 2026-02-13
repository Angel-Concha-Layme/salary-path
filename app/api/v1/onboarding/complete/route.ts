import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import { completeOnboarding } from "@/app/lib/server/domain/onboarding/onboarding.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request)
    const payload = await request.json()
    const result = await completeOnboarding(session.user.id, payload)

    return jsonOk(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
