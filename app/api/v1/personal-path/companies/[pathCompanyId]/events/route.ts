import { jsonError, jsonOkWithoutNulls } from "@/app/lib/server/api-response"
import {
  createPathCompanyEvent,
  listPathCompanyEvents,
} from "@/app/lib/server/domain/personal-path/path-company-events.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

interface RouteParams {
  pathCompanyId: string
}

export async function GET(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { pathCompanyId } = await context.params
    const result = await listPathCompanyEvents(session.user.id, pathCompanyId)

    return jsonOkWithoutNulls(result)
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(
  request: Request,
  context: {
    params: Promise<RouteParams>
  }
) {
  try {
    const session = await requireApiSession(request)
    const { pathCompanyId } = await context.params
    const payload = await request.json()
    const result = await createPathCompanyEvent(session.user.id, pathCompanyId, payload)

    return jsonOkWithoutNulls(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
