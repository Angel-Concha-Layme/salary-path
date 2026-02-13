import { QueryClient } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getMeQueryOptions } from "@/app/hooks/user/use-me-query"
import { meService } from "@/app/lib/services/user/me.service"

describe("useMeQuery options", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  afterEach(() => {
    vi.restoreAllMocks()
    queryClient.clear()
  })

  it("deduplicates concurrent requests for the same key", async () => {
    const serviceSpy = vi.spyOn(meService, "getMe").mockResolvedValue({
      source: "cookie",
      user: {
        id: "1",
        email: "demo@example.com",
        name: "Demo",
        role: "user",
        onboardingCompletedAt: null,
      },
    })

    await Promise.all([
      queryClient.fetchQuery(getMeQueryOptions()),
      queryClient.fetchQuery(getMeQueryOptions()),
    ])

    expect(serviceSpy).toHaveBeenCalledTimes(1)
  })

  it("uses staleTime of 5 minutes", () => {
    const queryOptions = getMeQueryOptions()

    expect(queryOptions.staleTime).toBe(1000 * 60 * 5)
  })
})
