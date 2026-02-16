import { QueryClient } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"

import { invalidateDomain } from "@/app/lib/services/cache-invalidation"
import { queryKeys } from "@/app/lib/services/query-keys"

describe("invalidateDomain", () => {
  const queryClient = new QueryClient()

  afterEach(() => {
    vi.restoreAllMocks()
    queryClient.clear()
  })

  it("invalidates only me keys for me domain", async () => {
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined)

    await invalidateDomain(queryClient, "me")

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: queryKeys.me.root() })
  })

  it("invalidates settings and me keys for settings domain", async () => {
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined)

    await invalidateDomain(queryClient, "settings")

    expect(invalidateSpy).toHaveBeenCalledTimes(3)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: queryKeys.settings.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: queryKeys.me.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(3, { queryKey: queryKeys.profile.root() })
  })

  it("invalidates companies and personal path keys for companies domain", async () => {
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined)

    await invalidateDomain(queryClient, "companies")

    expect(invalidateSpy).toHaveBeenCalledTimes(2)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: queryKeys.companies.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: queryKeys.personalPath.root() })
  })

  it("invalidates role keys for roles domain", async () => {
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined)

    await invalidateDomain(queryClient, "roles")

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: queryKeys.roles.root() })
  })

  it("invalidates personal path, profile, companies and roles for personalPath domain", async () => {
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined)

    await invalidateDomain(queryClient, "personalPath")

    expect(invalidateSpy).toHaveBeenCalledTimes(4)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: queryKeys.personalPath.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: queryKeys.profile.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(3, { queryKey: queryKeys.companies.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(4, { queryKey: queryKeys.roles.root() })
  })

  it("invalidates onboarding-related domains for onboarding domain", async () => {
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined)

    await invalidateDomain(queryClient, "onboarding")

    expect(invalidateSpy).toHaveBeenCalledTimes(7)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: queryKeys.onboarding.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: queryKeys.me.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(3, { queryKey: queryKeys.profile.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(4, { queryKey: queryKeys.settings.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(5, { queryKey: queryKeys.personalPath.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(6, { queryKey: queryKeys.companies.root() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(7, { queryKey: queryKeys.roles.root() })
  })
})
