import { sql } from "drizzle-orm"

import { db } from "@/app/lib/db/client"
import { user } from "@/app/lib/db/schema"
import {
  normalizeEmail,
  signUpEmailSchema,
} from "@/app/lib/models/auth/email-signup-validation.model"
import { ApiError } from "@/app/lib/server/api-error"
import { jsonError, jsonOk } from "@/app/lib/server/api-response"

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const rawEmail = searchParams.get("email")

    if (!rawEmail) {
      throw new ApiError(400, "BAD_REQUEST", "Email is required")
    }

    const normalizedEmail = normalizeEmail(rawEmail)
    const parsedEmail = signUpEmailSchema.safeParse(normalizedEmail)

    if (!parsedEmail.success) {
      throw new ApiError(400, "BAD_REQUEST", parsedEmail.error.issues[0]?.message ?? "Invalid email")
    }

    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(sql`lower(${user.email}) = ${parsedEmail.data}`)
      .limit(1)

    return jsonOk({
      email: parsedEmail.data,
      exists: existing.length > 0,
    })
  } catch (error) {
    return jsonError(error)
  }
}
