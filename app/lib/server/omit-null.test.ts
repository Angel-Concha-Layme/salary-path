import { describe, expect, it } from "vitest"

import { omitNullValuesDeep } from "@/app/lib/server/omit-null"

describe("omitNullValuesDeep", () => {
  it("removes null keys recursively from objects", () => {
    const input = {
      id: "x",
      deletedAt: null,
      nested: {
        notes: null,
        value: 1,
      },
    }

    expect(omitNullValuesDeep(input)).toEqual({
      id: "x",
      nested: {
        value: 1,
      },
    })
  })

  it("keeps array shape while compacting object entries", () => {
    const input = {
      items: [
        { id: "1", endDate: null },
        { id: "2", endDate: "2026-01-01T00:00:00.000Z" },
      ],
    }

    expect(omitNullValuesDeep(input)).toEqual({
      items: [
        { id: "1" },
        { id: "2", endDate: "2026-01-01T00:00:00.000Z" },
      ],
    })
  })

  it("preserves primitive falsy values", () => {
    const input = {
      count: 0,
      active: false,
      text: "",
      nested: {
        score: 0,
      },
    }

    expect(omitNullValuesDeep(input)).toEqual(input)
  })
})
