import { describe, expect, it } from "vitest"

import { createAppQueryClient } from "@/components/providers/app-providers"

describe("createAppQueryClient", () => {
  it("keeps refetchOnWindowFocus disabled globally", () => {
    const queryClient = createAppQueryClient()
    const defaults = queryClient.getDefaultOptions()

    expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
  })
})
