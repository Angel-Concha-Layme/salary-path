import { QueryClient } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getAdminUsersQueryOptions } from "@/app/hooks/user/use-admin-users-query"
import { adminUsersService } from "@/app/lib/services/user/admin-users.service"

describe("useAdminUsersQuery options", () => {
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

  it("returns cached data within staleTime to avoid extra requests", async () => {
    const serviceSpy = vi.spyOn(adminUsersService, "getAdminUsers").mockResolvedValue({
      users: [],
      total: 0,
      protected: true,
      scope: "admin",
    })

    const queryOptions = getAdminUsersQueryOptions({ limit: 50 })
    await queryClient.fetchQuery(queryOptions)
    await queryClient.fetchQuery(queryOptions)

    expect(serviceSpy).toHaveBeenCalledTimes(1)
  })

  it("uses staleTime of 30 seconds", () => {
    const queryOptions = getAdminUsersQueryOptions({ limit: 50 })

    expect(queryOptions.staleTime).toBe(1000 * 30)
  })
})
