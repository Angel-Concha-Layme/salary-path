import { afterEach, describe, expect, it, vi } from "vitest"

import { apiClient } from "@/app/lib/services/api-client"

describe("apiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns data when API responds with success envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { value: "ok" } }), {
        status: 200,
      })
    )

    const result = await apiClient.get<{ value: string }>("/health")

    expect(result).toEqual({ value: "ok" })
  })

  it("throws ApiClientError when API responds with failure envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            status: 401,
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        { status: 401 }
      )
    )

    await expect(apiClient.get("/me")).rejects.toMatchObject({
      name: "ApiClientError",
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authentication required",
    })
  })

  it("throws HTTP_* code when response is not envelope-based", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Service unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      })
    )

    await expect(apiClient.get("/me")).rejects.toMatchObject({
      name: "ApiClientError",
      status: 503,
      code: "HTTP_503",
      message: "Service Unavailable",
    })
  })

  it("throws ABORTED code when request is canceled", async () => {
    const abortError = new DOMException("Request aborted", "AbortError")
    vi.spyOn(globalThis, "fetch").mockRejectedValue(abortError)

    const controller = new AbortController()
    controller.abort()

    await expect(apiClient.get("/me", { signal: controller.signal })).rejects.toMatchObject({
      name: "ApiClientError",
      status: 499,
      code: "ABORTED",
      message: "Request was aborted",
    })
  })
})
