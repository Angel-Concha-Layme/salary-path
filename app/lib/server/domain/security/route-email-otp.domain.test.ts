import { describe, expect, it, vi } from "vitest"

vi.mock("@/app/lib/db/client", () => ({
  db: {
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
  },
}))

import {
  createRouteEmailOtpDomain,
  type RouteEmailOtpRepository,
} from "@/app/lib/server/domain/security/route-email-otp.domain"
import { ApiError } from "@/app/lib/server/api-error"
import type { RouteStepUpKey } from "@/app/lib/security/route-protection-config"

type ChallengeRecord = {
  id: string
  ownerUserId: string
  routeKey: RouteStepUpKey
  codeHash: string
  codeSalt: string
  attemptCount: number
  maxAttempts: number
  expiresAt: Date
  invalidatedAt: Date | null
  consumedAt: Date | null
  createdAt: Date
  updatedAt: Date
  ipAddress: string | null
  userAgent: string | null
}

type GrantRecord = {
  id: string
  ownerUserId: string
  routeKey: RouteStepUpKey
  method: "email_otp"
  verifiedAt: Date
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

class InMemoryRouteEmailOtpRepository implements RouteEmailOtpRepository {
  readonly challenges: ChallengeRecord[] = []
  readonly grants: GrantRecord[] = []

  async withTransaction<T>(fn: (repository: RouteEmailOtpRepository) => Promise<T>): Promise<T> {
    return fn(this)
  }

  async getLatestChallenge(ownerUserId: string, routeKey: RouteStepUpKey) {
    const rows = this.challenges
      .filter((row) => row.ownerUserId === ownerUserId && row.routeKey === routeKey)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())

    return rows[0] ?? null
  }

  async getLatestActiveChallenge(ownerUserId: string, routeKey: RouteStepUpKey, nowAt: Date) {
    const rows = this.challenges
      .filter(
        (row) =>
          row.ownerUserId === ownerUserId &&
          row.routeKey === routeKey &&
          row.invalidatedAt === null &&
          row.consumedAt === null &&
          row.expiresAt > nowAt
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())

    return rows[0] ?? null
  }

  async countChallengesSince(ownerUserId: string, routeKey: RouteStepUpKey, since: Date) {
    return this.challenges.filter(
      (row) =>
        row.ownerUserId === ownerUserId &&
        row.routeKey === routeKey &&
        row.createdAt >= since
    ).length
  }

  async invalidateActiveChallenges(ownerUserId: string, routeKey: RouteStepUpKey, nowAt: Date) {
    for (const row of this.challenges) {
      if (
        row.ownerUserId === ownerUserId &&
        row.routeKey === routeKey &&
        row.invalidatedAt === null &&
        row.consumedAt === null &&
        row.expiresAt > nowAt
      ) {
        row.invalidatedAt = nowAt
        row.updatedAt = nowAt
      }
    }
  }

  async createChallenge(input: {
    id: string
    ownerUserId: string
    routeKey: RouteStepUpKey
    codeHash: string
    codeSalt: string
    attemptCount: number
    maxAttempts: number
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
    ipAddress: string | null
    userAgent: string | null
  }) {
    const row: ChallengeRecord = {
      ...input,
      invalidatedAt: null,
      consumedAt: null,
    }

    this.challenges.push(row)
    return row
  }

  async updateChallengeAttempts(
    challengeId: string,
    attemptCount: number,
    nowAt: Date,
    invalidatedAt: Date | null
  ) {
    const row = this.challenges.find((challenge) => challenge.id === challengeId)

    if (!row) {
      return
    }

    row.attemptCount = attemptCount
    row.invalidatedAt = invalidatedAt
    row.updatedAt = nowAt
  }

  async consumeChallenge(challengeId: string, consumedAt: Date) {
    const row = this.challenges.find((challenge) => challenge.id === challengeId)

    if (!row) {
      return
    }

    row.consumedAt = consumedAt
    row.updatedAt = consumedAt
  }

  async getActiveGrant(
    ownerUserId: string,
    routeKey: RouteStepUpKey,
    nowAt: Date,
    options: { ignoreExpiry?: boolean } = {}
  ) {
    const { ignoreExpiry = false } = options
    const rows = this.grants
      .filter(
        (row) =>
          row.ownerUserId === ownerUserId &&
          row.routeKey === routeKey &&
          row.method === "email_otp" &&
          row.revokedAt === null &&
          (ignoreExpiry || row.expiresAt > nowAt)
      )
      .sort((left, right) => right.verifiedAt.getTime() - left.verifiedAt.getTime())

    return rows[0] ?? null
  }

  async upsertGrant(input: {
    id: string
    ownerUserId: string
    routeKey: RouteStepUpKey
    method: "email_otp"
    verifiedAt: Date
    expiresAt: Date
    updatedAt: Date
  }) {
    const existing = this.grants.find(
      (row) =>
        row.ownerUserId === input.ownerUserId &&
        row.routeKey === input.routeKey &&
        row.method === input.method
    )

    if (existing) {
      existing.verifiedAt = input.verifiedAt
      existing.expiresAt = input.expiresAt
      existing.revokedAt = null
      existing.updatedAt = input.updatedAt
      return existing
    }

    const row: GrantRecord = {
      ...input,
      revokedAt: null,
      createdAt: input.updatedAt,
    }

    this.grants.push(row)
    return row
  }
}

function createClock(initialIso: string) {
  let nowValue = new Date(initialIso)

  return {
    now: () => new Date(nowValue),
    advanceSeconds(seconds: number) {
      nowValue = new Date(nowValue.getTime() + seconds * 1000)
    },
    advanceHours(hours: number) {
      nowValue = new Date(nowValue.getTime() + hours * 60 * 60 * 1000)
    },
  }
}

function expectApiErrorCode(error: unknown, code: string) {
  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).code).toBe(code)
}

describe("route email otp domain", () => {
  const ownerUserId = "user-1"
  const email = "user@example.com"
  const routeKey: RouteStepUpKey = "comparison"

  it("creates a challenge and sends an OTP email", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const sendEmail = vi.fn().mockResolvedValue(undefined)
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail,
      now: clock.now,
    })

    const response = await domain.sendRouteEmailOtpForUser({
      ownerUserId,
      email,
      routeKey,
    })

    expect(repository.challenges).toHaveLength(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0]?.[0].code).toMatch(/^\d{6}$/)
    expect(response.routeKey).toBe(routeKey)
    expect(response.remainingSends24h).toBe(4)
  })

  it("invalidates the previous challenge when sending a new OTP", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const sendEmail = vi.fn().mockResolvedValue(undefined)
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail,
      now: clock.now,
    })

    await domain.sendRouteEmailOtpForUser({
      ownerUserId,
      email,
      routeKey,
    })

    clock.advanceSeconds(61)

    await domain.sendRouteEmailOtpForUser({
      ownerUserId,
      email,
      routeKey,
    })

    expect(repository.challenges).toHaveLength(2)
    expect(repository.challenges[0]?.invalidatedAt).not.toBeNull()
    expect(repository.challenges[1]?.invalidatedAt).toBeNull()
  })

  it("enforces resend cooldown", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail: vi.fn().mockResolvedValue(undefined),
      now: clock.now,
    })

    await domain.sendRouteEmailOtpForUser({
      ownerUserId,
      email,
      routeKey,
    })

    clock.advanceSeconds(30)

    await expect(
      domain.sendRouteEmailOtpForUser({
        ownerUserId,
        email,
        routeKey,
      })
    ).rejects.toSatisfy((error: unknown) => {
      expectApiErrorCode(error, "ROUTE_OTP_COOLDOWN")
      return true
    })
  })

  it("enforces daily send limit (5 per sliding 24h)", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail: vi.fn().mockResolvedValue(undefined),
      now: clock.now,
    })

    for (let index = 0; index < 5; index += 1) {
      await domain.sendRouteEmailOtpForUser({
        ownerUserId,
        email,
        routeKey,
      })
      clock.advanceSeconds(61)
    }

    await expect(
      domain.sendRouteEmailOtpForUser({
        ownerUserId,
        email,
        routeKey,
      })
    ).rejects.toSatisfy((error: unknown) => {
      expectApiErrorCode(error, "ROUTE_OTP_DAILY_LIMIT")
      return true
    })
  })

  it("verifies a valid code and creates a non-expiring grant when configured", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const sendEmail = vi.fn().mockResolvedValue(undefined)
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail,
      now: clock.now,
    })

    await domain.sendRouteEmailOtpForUser({
      ownerUserId,
      email,
      routeKey,
    })

    const sentCode = sendEmail.mock.calls[0]?.[0].code

    if (!sentCode) {
      throw new Error("Expected a sent OTP code")
    }

    const verification = await domain.verifyRouteEmailOtpForUser({
      ownerUserId,
      routeKey,
      code: sentCode,
    })

    expect(verification.verified).toBe(true)
    expect(verification.verificationExpiresAt).toBe("9999-12-31T23:59:59.999Z")
    expect(repository.grants).toHaveLength(1)
    expect(repository.challenges[0]?.consumedAt).not.toBeNull()
  })

  it("increments invalid attempts for wrong code", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail: vi.fn().mockResolvedValue(undefined),
      now: clock.now,
    })

    await domain.sendRouteEmailOtpForUser({
      ownerUserId,
      email,
      routeKey,
    })

    await expect(
      domain.verifyRouteEmailOtpForUser({
        ownerUserId,
        routeKey,
        code: "000000",
      })
    ).rejects.toSatisfy((error: unknown) => {
      expectApiErrorCode(error, "ROUTE_OTP_INVALID_OR_EXPIRED")
      return true
    })

    expect(repository.challenges[0]?.attemptCount).toBe(1)
  })

  it("blocks verification on the 6th invalid attempt when max attempts is 5", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail: vi.fn().mockResolvedValue(undefined),
      now: clock.now,
    })

    await domain.sendRouteEmailOtpForUser({
      ownerUserId,
      email,
      routeKey,
    })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        domain.verifyRouteEmailOtpForUser({
          ownerUserId,
          routeKey,
          code: "000000",
        })
      ).rejects.toSatisfy((error: unknown) => {
        expectApiErrorCode(error, "ROUTE_OTP_INVALID_OR_EXPIRED")
        return true
      })
    }

    await expect(
      domain.verifyRouteEmailOtpForUser({
        ownerUserId,
        routeKey,
        code: "000000",
      })
    ).rejects.toSatisfy((error: unknown) => {
      expectApiErrorCode(error, "ROUTE_OTP_ATTEMPTS_EXCEEDED")
      return true
    })
  })

  it("rejects expired OTP code", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const sendEmail = vi.fn().mockResolvedValue(undefined)
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail,
      now: clock.now,
    })

    await domain.sendRouteEmailOtpForUser({
      ownerUserId,
      email,
      routeKey,
    })

    const sentCode = sendEmail.mock.calls[0]?.[0].code

    if (!sentCode) {
      throw new Error("Expected a sent OTP code")
    }

    clock.advanceHours(5)
    clock.advanceSeconds(1)

    await expect(
      domain.verifyRouteEmailOtpForUser({
        ownerUserId,
        routeKey,
        code: sentCode,
      })
    ).rejects.toSatisfy((error: unknown) => {
      expectApiErrorCode(error, "ROUTE_OTP_INVALID_OR_EXPIRED")
      return true
    })
  })

  it("returns explicit provider error when email provider is missing", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail: vi.fn().mockRejectedValue(
        new ApiError(500, "EMAIL_PROVIDER_NOT_CONFIGURED", "Email provider is not configured")
      ),
      now: clock.now,
    })

    await expect(
      domain.sendRouteEmailOtpForUser({
        ownerUserId,
        email,
        routeKey,
      })
    ).rejects.toSatisfy((error: unknown) => {
      expectApiErrorCode(error, "EMAIL_PROVIDER_NOT_CONFIGURED")
      return true
    })
  })
})

describe("route access guard assertions", () => {
  const ownerUserId = "user-1"
  const routeKey: RouteStepUpKey = "comparison"

  it("throws ROUTE_VERIFICATION_REQUIRED without a valid grant", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail: vi.fn().mockResolvedValue(undefined),
      now: clock.now,
    })

    await expect(domain.assertRouteAccessForUser(ownerUserId, routeKey)).rejects.toSatisfy(
      (error: unknown) => {
        expectApiErrorCode(error, "ROUTE_VERIFICATION_REQUIRED")
        return true
      }
    )
  })

  it("allows access with an active grant", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail: vi.fn().mockResolvedValue(undefined),
      now: clock.now,
    })

    repository.grants.push({
      id: "grant-1",
      ownerUserId,
      routeKey,
      method: "email_otp",
      verifiedAt: new Date("2026-02-19T20:00:00.000Z"),
      expiresAt: new Date("2026-02-19T23:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-02-19T20:00:00.000Z"),
      updatedAt: new Date("2026-02-19T20:00:00.000Z"),
    })

    await expect(domain.assertRouteAccessForUser(ownerUserId, routeKey)).resolves.toBeUndefined()
  })

  it("allows access even when grant expiry is in the past if route is configured as non-expiring", async () => {
    const repository = new InMemoryRouteEmailOtpRepository()
    const clock = createClock("2026-02-19T20:00:00.000Z")
    const domain = createRouteEmailOtpDomain({
      repository,
      sendEmail: vi.fn().mockResolvedValue(undefined),
      now: clock.now,
    })

    repository.grants.push({
      id: "grant-1",
      ownerUserId,
      routeKey,
      method: "email_otp",
      verifiedAt: new Date("2026-02-19T13:00:00.000Z"),
      expiresAt: new Date("2026-02-19T19:59:59.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-02-19T13:00:00.000Z"),
      updatedAt: new Date("2026-02-19T13:00:00.000Z"),
    })

    await expect(domain.assertRouteAccessForUser(ownerUserId, routeKey)).resolves.toBeUndefined()
  })
})
