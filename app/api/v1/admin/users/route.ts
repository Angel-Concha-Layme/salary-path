import { desc } from "drizzle-orm"

import { db } from "@/app/lib/db/client"
import { user } from "@/app/lib/db/schema"
import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import { requireApiAdminSession } from "@/app/lib/server/require-api-admin-session"

export async function GET(request: Request) {
  try {
    await requireApiAdminSession(request)
    const searchParams = new URL(request.url).searchParams
    const requestedLimit = Number(searchParams.get("limit") ?? 50)
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(100, Math.trunc(requestedLimit)))
      : 50

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(limit)

    return jsonOk({
      users,
      total: users.length,
      protected: true,
      scope: "admin",
    })
  } catch (error) {
    return jsonError(error)
  }
}
