import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import { getOnboardingStatus } from "@/app/lib/server/domain/onboarding/onboarding.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request)
    const result = await getOnboardingStatus(session.user.id)

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}
