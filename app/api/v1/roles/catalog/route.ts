import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  createRoleCatalog,
  listRoleCatalog,
} from "@/app/lib/server/domain/roles/role-catalog.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

export async function GET(request: Request) {
  try {
    await requireApiSession(request)
    const searchParams = new URL(request.url).searchParams
    const requestedLimit = Number(searchParams.get("limit") ?? 50)
    const search = searchParams.get("search") ?? undefined

    const result = await listRoleCatalog({
      limit: requestedLimit,
      search,
    })

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request)
    const payload = await request.json()
    const result = await createRoleCatalog(session.user.id, payload)

    return jsonOk(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
