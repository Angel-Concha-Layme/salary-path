import { jsonOk } from "@/app/lib/server/api-response"

export async function GET() {
  return jsonOk({
    service: "salary-path",
    status: "ok",
    timestamp: new Date().toISOString(),
  })
}
