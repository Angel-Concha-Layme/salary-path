import { jsonError, jsonOk } from "@/app/lib/server/api-response"
import {
  createComparisonPersona,
  listComparisonPersonas,
} from "@/app/lib/server/domain/comparison/comparison-personas.domain"
import { requireApiRouteAccess } from "@/app/lib/server/require-api-route-access"

export async function GET(request: Request) {
  try {
    const session = await requireApiRouteAccess(request, "comparison")
    const searchParams = new URL(request.url).searchParams
    const requestedLimit = Number(searchParams.get("limit") ?? 50)

    const result = await listComparisonPersonas(session.user.id, {
      limit: requestedLimit,
    })

    return jsonOk(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiRouteAccess(request, "comparison")
    const payload = await request.json()
    const result = await createComparisonPersona(session.user.id, payload)

    return jsonOk(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
