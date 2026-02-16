import { QueryClient } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getProfileOverviewQueryOptions } from "@/app/hooks/profile/use-profile-overview"
import { profileOverviewService } from "@/app/lib/services/profile/profile-overview.service"

describe("useProfileOverviewQuery options", () => {
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
    const serviceSpy = vi.spyOn(profileOverviewService, "getProfileOverview").mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "demo@example.com",
        name: "Demo",
        role: "user",
        image: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        onboardingCompletedAt: null,
        banned: false,
        banReason: null,
        banExpires: null,
      },
      financeSettings: null,
      salary: {
        baseCurrency: "USD",
        annualAverage: null,
        annualAverageCompanyCount: 0,
        excludedFromAverageCount: 0,
        totalCompanies: 0,
        byCompany: [],
      },
      careerEventsByCompany: [],
      usefulInfo: {
        totalCompanies: 0,
        activeCompanies: 0,
        totalCareerEvents: 0,
        averageCompanyScore: null,
        firstCompanyStartDate: null,
        latestCareerEventDate: null,
        yearsTracked: null,
        monthlyWorkHours: 174,
        workDaysPerYear: 261,
        preferredCurrency: "USD",
        preferredLocale: "es",
      },
    })

    await Promise.all([
      queryClient.fetchQuery(getProfileOverviewQueryOptions()),
      queryClient.fetchQuery(getProfileOverviewQueryOptions()),
    ])

    expect(serviceSpy).toHaveBeenCalledTimes(1)
  })

  it("uses 10 minutes staleTime and 20 minutes cacheTime", () => {
    const queryOptions = getProfileOverviewQueryOptions()

    expect(queryOptions.staleTime).toBe(1000 * 60 * 10)
    expect(queryOptions.cacheTime).toBe(1000 * 60 * 20)
  })
})
