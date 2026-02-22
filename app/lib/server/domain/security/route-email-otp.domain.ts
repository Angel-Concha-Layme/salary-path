import { and, desc, eq, gt, gte, isNull, sql } from "drizzle-orm"
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto"

import { db } from "@/app/lib/db/client"
import { routeAccessGrants, routeEmailOtpChallenges } from "@/app/lib/db/schema"
import type {
  RouteAccessEmailOtpSendResponse,
  RouteAccessEmailOtpVerifyResponse,
  RouteAccessStatusResponse,
} from "@/app/lib/models/security/route-access.model"
import {
  getRouteProtectionPolicy,
  type RouteProtectionPolicy,
  type RouteStepUpKey,
} from "@/app/lib/security/route-protection-config"
import { ApiError } from "@/app/lib/server/api-error"
import { sendRouteOtpEmail, type SendRouteOtpEmailInput } from "@/app/lib/server/email/resend-email.service"

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type DbExecutor = typeof db | DbTx

type RouteEmailOtpChallengeRecord = typeof routeEmailOtpChallenges.$inferSelect
type RouteAccessGrantRecord = typeof routeAccessGrants.$inferSelect

interface CreateChallengeInput {
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
}

interface UpsertGrantInput {
  id: string
  ownerUserId: string
  routeKey: RouteStepUpKey
  method: "email_otp"
  verifiedAt: Date
  expiresAt: Date
  updatedAt: Date
}

interface GetActiveGrantOptions {
  ignoreExpiry?: boolean
}

export interface RouteEmailOtpRepository {
  withTransaction<T>(fn: (repository: RouteEmailOtpRepository) => Promise<T>): Promise<T>
  getLatestChallenge(
    ownerUserId: string,
    routeKey: RouteStepUpKey
  ): Promise<RouteEmailOtpChallengeRecord | null>
  getLatestActiveChallenge(
    ownerUserId: string,
    routeKey: RouteStepUpKey,
    nowAt: Date
  ): Promise<RouteEmailOtpChallengeRecord | null>
  countChallengesSince(ownerUserId: string, routeKey: RouteStepUpKey, since: Date): Promise<number>
  invalidateActiveChallenges(ownerUserId: string, routeKey: RouteStepUpKey, nowAt: Date): Promise<void>
  createChallenge(input: CreateChallengeInput): Promise<RouteEmailOtpChallengeRecord>
  updateChallengeAttempts(
    challengeId: string,
    attemptCount: number,
    nowAt: Date,
    invalidatedAt: Date | null
  ): Promise<void>
  consumeChallenge(challengeId: string, consumedAt: Date): Promise<void>
  getActiveGrant(
    ownerUserId: string,
    routeKey: RouteStepUpKey,
    nowAt: Date,
    options?: GetActiveGrantOptions
  ): Promise<RouteAccessGrantRecord | null>
  upsertGrant(input: UpsertGrantInput): Promise<RouteAccessGrantRecord>
}

export interface RouteEmailOtpDomainDependencies {
  repository: RouteEmailOtpRepository
  sendEmail: (input: SendRouteOtpEmailInput) => Promise<void>
  now: () => Date
}

export interface SendRouteEmailOtpInput {
  ownerUserId: string
  email: string
  routeKey: RouteStepUpKey
  ipAddress?: string | null
  userAgent?: string | null
}

export interface VerifyRouteEmailOtpInput {
  ownerUserId: string
  routeKey: RouteStepUpKey
  code: string
}

function createDrizzleRouteEmailOtpRepository(
  executor: DbExecutor,
  inTransaction = false
): RouteEmailOtpRepository {
  const repository: RouteEmailOtpRepository = {
    async withTransaction<T>(fn: (txRepository: RouteEmailOtpRepository) => Promise<T>) {
      if (inTransaction) {
        return fn(repository)
      }

      return db.transaction(async (tx) => {
        const txRepository = createDrizzleRouteEmailOtpRepository(tx, true)
        return fn(txRepository)
      })
    },

    async getLatestChallenge(ownerUserId, routeKey) {
      const rows = await executor
        .select()
        .from(routeEmailOtpChallenges)
        .where(
          and(
            eq(routeEmailOtpChallenges.ownerUserId, ownerUserId),
            eq(routeEmailOtpChallenges.routeKey, routeKey)
          )
        )
        .orderBy(desc(routeEmailOtpChallenges.createdAt))
        .limit(1)

      return rows[0] ?? null
    },

    async getLatestActiveChallenge(ownerUserId, routeKey, nowAt) {
      const rows = await executor
        .select()
        .from(routeEmailOtpChallenges)
        .where(
          and(
            eq(routeEmailOtpChallenges.ownerUserId, ownerUserId),
            eq(routeEmailOtpChallenges.routeKey, routeKey),
            isNull(routeEmailOtpChallenges.invalidatedAt),
            isNull(routeEmailOtpChallenges.consumedAt),
            gt(routeEmailOtpChallenges.expiresAt, nowAt)
          )
        )
        .orderBy(desc(routeEmailOtpChallenges.createdAt))
        .limit(1)

      return rows[0] ?? null
    },

    async countChallengesSince(ownerUserId, routeKey, since) {
      const rows = await executor
        .select({
          total: sql<number>`count(*)`,
        })
        .from(routeEmailOtpChallenges)
        .where(
          and(
            eq(routeEmailOtpChallenges.ownerUserId, ownerUserId),
            eq(routeEmailOtpChallenges.routeKey, routeKey),
            gte(routeEmailOtpChallenges.createdAt, since)
          )
        )

      return Number(rows[0]?.total ?? 0)
    },

    async invalidateActiveChallenges(ownerUserId, routeKey, nowAt) {
      await executor
        .update(routeEmailOtpChallenges)
        .set({
          invalidatedAt: nowAt,
          updatedAt: nowAt,
        })
        .where(
          and(
            eq(routeEmailOtpChallenges.ownerUserId, ownerUserId),
            eq(routeEmailOtpChallenges.routeKey, routeKey),
            isNull(routeEmailOtpChallenges.invalidatedAt),
            isNull(routeEmailOtpChallenges.consumedAt),
            gt(routeEmailOtpChallenges.expiresAt, nowAt)
          )
        )
    },

    async createChallenge(input) {
      const rows = await executor
        .insert(routeEmailOtpChallenges)
        .values(input)
        .returning()

      const row = rows[0]

      if (!row) {
        throw new ApiError(500, "INTERNAL_ERROR", "Failed to create OTP challenge")
      }

      return row
    },

    async updateChallengeAttempts(challengeId, attemptCount, nowAt, invalidatedAt) {
      await executor
        .update(routeEmailOtpChallenges)
        .set({
          attemptCount,
          invalidatedAt,
          updatedAt: nowAt,
        })
        .where(eq(routeEmailOtpChallenges.id, challengeId))
    },

    async consumeChallenge(challengeId, consumedAt) {
      await executor
        .update(routeEmailOtpChallenges)
        .set({
          consumedAt,
          updatedAt: consumedAt,
        })
        .where(eq(routeEmailOtpChallenges.id, challengeId))
    },

    async getActiveGrant(ownerUserId, routeKey, nowAt, options = {}) {
      const { ignoreExpiry = false } = options
      const conditions = [
        eq(routeAccessGrants.ownerUserId, ownerUserId),
        eq(routeAccessGrants.routeKey, routeKey),
        eq(routeAccessGrants.method, "email_otp"),
        isNull(routeAccessGrants.revokedAt),
        ...(ignoreExpiry ? [] : [gt(routeAccessGrants.expiresAt, nowAt)]),
      ]

      const rows = await executor
        .select()
        .from(routeAccessGrants)
        .where(and(...conditions))
        .orderBy(desc(routeAccessGrants.verifiedAt))
        .limit(1)

      return rows[0] ?? null
    },

    async upsertGrant(input) {
      const rows = await executor
        .insert(routeAccessGrants)
        .values({
          id: input.id,
          ownerUserId: input.ownerUserId,
          routeKey: input.routeKey,
          method: input.method,
          verifiedAt: input.verifiedAt,
          expiresAt: input.expiresAt,
          createdAt: input.updatedAt,
          updatedAt: input.updatedAt,
          revokedAt: null,
        })
        .onConflictDoUpdate({
          target: [
            routeAccessGrants.ownerUserId,
            routeAccessGrants.routeKey,
            routeAccessGrants.method,
          ],
          set: {
            verifiedAt: input.verifiedAt,
            expiresAt: input.expiresAt,
            revokedAt: null,
            updatedAt: input.updatedAt,
          },
        })
        .returning()

      const row = rows[0]

      if (!row) {
        throw new ApiError(500, "INTERNAL_ERROR", "Failed to upsert route access grant")
      }

      return row
    },
  }

  return repository
}

function getRoutePolicyOrThrow(routeKey: RouteStepUpKey): RouteProtectionPolicy {
  const policy = getRouteProtectionPolicy(routeKey)

  if (!policy || policy.method !== "email_otp") {
    throw new ApiError(400, "BAD_REQUEST", "Route does not support email OTP verification")
  }

  return policy
}

function createCodeHash(codeSalt: string, code: string): string {
  return createHash("sha256").update(`${codeSalt}:${code}`).digest("hex")
}

function generateOtpCode(): string {
  return randomInt(0, 1_000_000)
    .toString()
    .padStart(6, "0")
}

function ensureCodeFormat(code: string): string {
  const normalized = code.trim()

  if (!/^\d{6}$/.test(normalized)) {
    throw new ApiError(400, "ROUTE_OTP_INVALID_OR_EXPIRED", "Invalid or expired verification code")
  }

  return normalized
}

function addHours(baseDate: Date, hours: number): Date {
  return new Date(baseDate.getTime() + hours * 60 * 60 * 1000)
}

function addSeconds(baseDate: Date, seconds: number): Date {
  return new Date(baseDate.getTime() + seconds * 1000)
}

function add24Hours(baseDate: Date): Date {
  return new Date(baseDate.getTime() - 24 * 60 * 60 * 1000)
}

function createForeverExpiresAt(): Date {
  return new Date("9999-12-31T23:59:59.999Z")
}

function equalsCodeHash(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, "hex")
  const right = Buffer.from(rightHex, "hex")

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

export function createRouteEmailOtpDomain({
  repository,
  sendEmail,
  now,
}: RouteEmailOtpDomainDependencies) {
  return {
    async getRouteAccessStatusForUser(
      ownerUserId: string,
      routeKey: RouteStepUpKey
    ): Promise<RouteAccessStatusResponse> {
      const policy = getRoutePolicyOrThrow(routeKey)
      const nowAt = now()
      const since = add24Hours(nowAt)

      const [activeGrant, activeChallenge, latestChallenge, sentInWindow] = await Promise.all([
        repository.getActiveGrant(ownerUserId, routeKey, nowAt, {
          ignoreExpiry: Boolean(policy.grantNeverExpires),
        }),
        repository.getLatestActiveChallenge(ownerUserId, routeKey, nowAt),
        repository.getLatestChallenge(ownerUserId, routeKey),
        repository.countChallengesSince(ownerUserId, routeKey, since),
      ])

      const resendAvailableAt = latestChallenge
        ? addSeconds(latestChallenge.createdAt, policy.resendCooldownSeconds)
        : null

      return {
        routeKey,
        required: true,
        verified: Boolean(activeGrant),
        verificationExpiresAt: activeGrant?.expiresAt.toISOString() ?? null,
        challengeActive: Boolean(activeChallenge),
        challengeExpiresAt: activeChallenge?.expiresAt.toISOString() ?? null,
        remainingSends24h: Math.max(0, policy.maxSendsPer24Hours - sentInWindow),
        resendAvailableAt:
          resendAvailableAt && resendAvailableAt > nowAt ? resendAvailableAt.toISOString() : null,
      }
    },

    async sendRouteEmailOtpForUser({
      ownerUserId,
      email,
      routeKey,
      ipAddress,
      userAgent,
    }: SendRouteEmailOtpInput): Promise<RouteAccessEmailOtpSendResponse> {
      const policy = getRoutePolicyOrThrow(routeKey)

      return repository.withTransaction(async (txRepository) => {
        const nowAt = now()
        const since = add24Hours(nowAt)
        const latestChallenge = await txRepository.getLatestChallenge(ownerUserId, routeKey)
        const sentInWindow = await txRepository.countChallengesSince(ownerUserId, routeKey, since)

        if (sentInWindow >= policy.maxSendsPer24Hours) {
          throw new ApiError(
            429,
            "ROUTE_OTP_DAILY_LIMIT",
            "Daily verification email limit reached"
          )
        }

        if (latestChallenge) {
          const resendAvailableAt = addSeconds(latestChallenge.createdAt, policy.resendCooldownSeconds)

          if (resendAvailableAt > nowAt) {
            throw new ApiError(
              429,
              "ROUTE_OTP_COOLDOWN",
              "Please wait before requesting another verification code",
              {
                resendAvailableAt: resendAvailableAt.toISOString(),
              }
            )
          }
        }

        const challengeId = randomUUID()
        const code = generateOtpCode()
        const codeSalt = randomBytes(16).toString("hex")
        const codeHash = createCodeHash(codeSalt, code)
        const challengeExpiresAt = addHours(nowAt, policy.ttlHours)

        await txRepository.invalidateActiveChallenges(ownerUserId, routeKey, nowAt)
        await txRepository.createChallenge({
          id: challengeId,
          ownerUserId,
          routeKey,
          codeHash,
          codeSalt,
          attemptCount: 0,
          maxAttempts: policy.maxAttempts,
          expiresAt: challengeExpiresAt,
          createdAt: nowAt,
          updatedAt: nowAt,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        })

        await sendEmail({
          ownerUserId,
          email,
          routeKey,
          challengeId,
          code,
        })

        return {
          routeKey,
          challengeExpiresAt: challengeExpiresAt.toISOString(),
          resendAvailableAt: addSeconds(nowAt, policy.resendCooldownSeconds).toISOString(),
          remainingSends24h: Math.max(0, policy.maxSendsPer24Hours - (sentInWindow + 1)),
        }
      })
    },

    async verifyRouteEmailOtpForUser({
      ownerUserId,
      routeKey,
      code,
    }: VerifyRouteEmailOtpInput): Promise<RouteAccessEmailOtpVerifyResponse> {
      const policy = getRoutePolicyOrThrow(routeKey)
      const normalizedCode = ensureCodeFormat(code)

      return repository.withTransaction(async (txRepository) => {
        const nowAt = now()
        const challenge = await txRepository.getLatestActiveChallenge(ownerUserId, routeKey, nowAt)

        if (!challenge) {
          throw new ApiError(400, "ROUTE_OTP_INVALID_OR_EXPIRED", "Invalid or expired verification code")
        }

        if (challenge.attemptCount >= challenge.maxAttempts) {
          await txRepository.updateChallengeAttempts(
            challenge.id,
            challenge.attemptCount,
            nowAt,
            nowAt
          )

          throw new ApiError(
            429,
            "ROUTE_OTP_ATTEMPTS_EXCEEDED",
            "Verification attempts exceeded. Request a new code."
          )
        }

        const expectedHash = createCodeHash(challenge.codeSalt, normalizedCode)
        const isValidCode = equalsCodeHash(challenge.codeHash, expectedHash)

        if (!isValidCode) {
          const nextAttemptCount = challenge.attemptCount + 1
          const attemptsExceeded = nextAttemptCount > challenge.maxAttempts

          await txRepository.updateChallengeAttempts(
            challenge.id,
            nextAttemptCount,
            nowAt,
            attemptsExceeded ? nowAt : null
          )

          if (attemptsExceeded) {
            throw new ApiError(
              429,
              "ROUTE_OTP_ATTEMPTS_EXCEEDED",
              "Verification attempts exceeded. Request a new code."
            )
          }

          throw new ApiError(400, "ROUTE_OTP_INVALID_OR_EXPIRED", "Invalid or expired verification code")
        }

        await txRepository.consumeChallenge(challenge.id, nowAt)

        const verificationExpiresAt = policy.grantNeverExpires
          ? createForeverExpiresAt()
          : addHours(nowAt, policy.grantTtlHours ?? policy.ttlHours)

        await txRepository.upsertGrant({
          id: randomUUID(),
          ownerUserId,
          routeKey,
          method: "email_otp",
          verifiedAt: nowAt,
          expiresAt: verificationExpiresAt,
          updatedAt: nowAt,
        })

        return {
          routeKey,
          verified: true,
          verificationExpiresAt: verificationExpiresAt.toISOString(),
        }
      })
    },

    async assertRouteAccessForUser(ownerUserId: string, routeKey: RouteStepUpKey): Promise<void> {
      const policy = getRoutePolicyOrThrow(routeKey)
      const nowAt = now()
      const grant = await repository.getActiveGrant(ownerUserId, routeKey, nowAt, {
        ignoreExpiry: Boolean(policy.grantNeverExpires),
      })

      if (!grant) {
        throw new ApiError(
          403,
          "ROUTE_VERIFICATION_REQUIRED",
          "Route requires additional email verification"
        )
      }
    },
  }
}

const defaultRouteEmailOtpDomain = createRouteEmailOtpDomain({
  repository: createDrizzleRouteEmailOtpRepository(db),
  sendEmail: sendRouteOtpEmail,
  now: () => new Date(),
})

export const getRouteAccessStatusForUser = defaultRouteEmailOtpDomain.getRouteAccessStatusForUser
export const sendRouteEmailOtpForUser = defaultRouteEmailOtpDomain.sendRouteEmailOtpForUser
export const verifyRouteEmailOtpForUser = defaultRouteEmailOtpDomain.verifyRouteEmailOtpForUser
export const assertRouteAccessForUser = defaultRouteEmailOtpDomain.assertRouteAccessForUser
