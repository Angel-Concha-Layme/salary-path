import { jsonError, jsonOkWithoutNulls } from "@/app/lib/server/api-response"
import {
  createPathCompany,
  listPathCompanies,
} from "@/app/lib/server/domain/personal-path/path-companies.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request)
    const result = await listPathCompanies(session.user.id)

    return jsonOkWithoutNulls(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request)
    const payload = await request.json()
    const result = await createPathCompany(session.user.id, payload)

    return jsonOkWithoutNulls(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
