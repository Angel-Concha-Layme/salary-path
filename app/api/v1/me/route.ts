import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import { db } from "@/app/lib/db/client"
import { user } from "@/app/lib/db/schema"
import { requireApiSession } from "@/app/lib/server/require-api-session"
import { eq } from "drizzle-orm"
import { toIso } from "@/app/lib/server/domain/common"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request)
    const rows = await db
      .select({ onboardingCompletedAt: user.onboardingCompletedAt })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    return jsonOk({
      source: session.source,
      user: {
        ...session.user,
        onboardingCompletedAt: toIso(rows[0]?.onboardingCompletedAt),
      },
    })
  } catch (error) {
    return jsonError(error)
  }
}
