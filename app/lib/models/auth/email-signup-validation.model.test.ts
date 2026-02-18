import { describe, expect, it } from "vitest"

import {
  AUTH_NAME_MAX_LENGTH,
  evaluatePasswordRules,
  isPasswordPolicyValid,
  normalizeEmail,
  normalizeName,
  signUpSchema,
} from "@/app/lib/models/auth/email-signup-validation.model"

function buildValidPayload() {
  return {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "abc12345",
  }
}

describe("email sign-up validation model", () => {
  it("accepts a name with exactly the max length and rejects max+1", () => {
    const exactlyMax = "a".repeat(AUTH_NAME_MAX_LENGTH)
    const aboveMax = "a".repeat(AUTH_NAME_MAX_LENGTH + 1)

    expect(
      signUpSchema.safeParse({
        ...buildValidPayload(),
        name: exactlyMax,
      }).success
    ).toBe(true)

    expect(
      signUpSchema.safeParse({
        ...buildValidPayload(),
        name: aboveMax,
      }).success
    ).toBe(false)
  })

  it("rejects password without letters", () => {
    const parsed = signUpSchema.safeParse({
      ...buildValidPayload(),
      password: "12345678",
    })

    expect(parsed.success).toBe(false)
  })

  it("rejects password without numbers", () => {
    const parsed = signUpSchema.safeParse({
      ...buildValidPayload(),
      password: "abcdefgh",
    })

    expect(parsed.success).toBe(false)
  })

  it("accepts valid password with letters and numbers", () => {
    const parsed = signUpSchema.safeParse({
      ...buildValidPayload(),
      password: "secure123",
    })

    expect(parsed.success).toBe(true)
  })

  it("rejects invalid email format", () => {
    const parsed = signUpSchema.safeParse({
      ...buildValidPayload(),
      email: "invalid-email",
    })

    expect(parsed.success).toBe(false)
  })

  it("normalizes email and name output", () => {
    const parsed = signUpSchema.parse({
      ...buildValidPayload(),
      name: "  Ada Lovelace  ",
      email: "  ADA@Example.COM  ",
    })

    expect(parsed.name).toBe("Ada Lovelace")
    expect(parsed.email).toBe("ada@example.com")
  })

  it("exposes helper normalization and password rule evaluators", () => {
    expect(normalizeName("  Jane Doe  ")).toBe("Jane Doe")
    expect(normalizeEmail("  USER@Example.COM  ")).toBe("user@example.com")

    const rules = evaluatePasswordRules("abc12345")
    expect(rules).toEqual({
      minLength: true,
      maxLength: true,
      hasLetter: true,
      hasNumber: true,
    })
    expect(isPasswordPolicyValid("abc12345")).toBe(true)
    expect(isPasswordPolicyValid("12345678")).toBe(false)
  })
})
