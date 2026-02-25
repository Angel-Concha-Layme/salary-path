import { eq } from "drizzle-orm"
import { betterAuth } from "better-auth"
import { createAuthMiddleware } from "better-auth/api"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins/admin"
import { jwt } from "better-auth/plugins/jwt"
import { headers } from "next/headers"

import { db } from "@/app/lib/db/client"
import * as schema from "@/app/lib/db/schema"
import { ensureAdminRole, hasAdminRole } from "@/app/lib/auth/roles"
import {
  AUTH_NAME_REQUIRED_MESSAGE,
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  normalizeName,
  signUpNameSchema,
  signUpSchema,
} from "@/app/lib/models/auth/email-signup-validation.model"

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required env: ${name}`)
  }

  return value
}

function getOptionalEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined
}

function getFirstIssueMessage(error: { issues: Array<{ message?: string }> }, fallback: string): string {
  return error.issues[0]?.message ?? fallback
}

function throwNameValidationError(
  context: { error: (status: "BAD_REQUEST", options: { message: string }) => Error } | null,
  message: string
): never {
  if (context) {
    throw context.error("BAD_REQUEST", { message })
  }

  throw new Error(message)
}

function parseNameOrThrow(
  value: unknown,
  context: { error: (status: "BAD_REQUEST", options: { message: string }) => Error } | null
): string {
  if (typeof value !== "string") {
    throwNameValidationError(context, AUTH_NAME_REQUIRED_MESSAGE)
  }

  const parsed = signUpNameSchema.safeParse(normalizeName(value))

  if (!parsed.success) {
    throwNameValidationError(
      context,
      getFirstIssueMessage(parsed.error, AUTH_NAME_REQUIRED_MESSAGE)
    )
  }

  return parsed.data
}

const trustedOrigins =
  getOptionalEnv("BETTER_AUTH_TRUSTED_ORIGINS")
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []

const adminEmails = new Set(
  (getOptionalEnv("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
)

const googleClientId = getOptionalEnv("GOOGLE_CLIENT_ID")
const googleClientSecret = getOptionalEnv("GOOGLE_CLIENT_SECRET")

export const googleProviderEnabled =
  Boolean(googleClientId && googleClientSecret) &&
  !googleClientId?.startsWith("replace_with") &&
  !googleClientSecret?.startsWith("replace_with")

const githubClientId = getOptionalEnv("GITHUB_CLIENT_ID")
const githubClientSecret = getOptionalEnv("GITHUB_CLIENT_SECRET")

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {}

if (githubClientId && githubClientSecret) {
  socialProviders.github = {
    clientId: githubClientId,
    clientSecret: githubClientSecret,
  }
}

if (googleProviderEnabled && googleClientId && googleClientSecret) {
  socialProviders.google = {
    clientId: googleClientId,
    clientSecret: googleClientSecret,
  }
}

const signUpValidationPlugin = {
  id: "salary-path-sign-up-validation",
  hooks: {
    before: [
      {
        matcher(ctx: { path?: string }) {
          return ctx.path === "/sign-up/email"
        },
        handler: createAuthMiddleware(async (ctx) => {
          const parsed = signUpSchema.safeParse(ctx.body)

          if (!parsed.success) {
            throw ctx.error("BAD_REQUEST", {
              message: getFirstIssueMessage(parsed.error, "Invalid sign-up payload"),
            })
          }
        }),
      },
    ],
  },
}

export const auth = betterAuth({
  appName: "Salary Path",
  baseURL: getRequiredEnv("BETTER_AUTH_URL"),
  secret: getRequiredEnv("BETTER_AUTH_SECRET"),
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: AUTH_PASSWORD_MIN_LENGTH,
    maxPasswordLength: AUTH_PASSWORD_MAX_LENGTH,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          const name = parseNameOrThrow(user.name, context)

          return {
            data: {
              ...user,
              name,
            },
          }
        },
      },
      update: {
        before: async (user, context) => {
          if (!Object.prototype.hasOwnProperty.call(user, "name")) {
            return
          }

          const name = parseNameOrThrow(user.name, context)

          return {
            data: {
              ...user,
              name,
            },
          }
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  socialProviders,
  plugins: [
    signUpValidationPlugin,
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    jwt({
      jwt: {
        issuer: getOptionalEnv("BETTER_AUTH_JWT_ISSUER"),
        audience: getOptionalEnv("BETTER_AUTH_JWT_AUDIENCE"),
        expirationTime: getOptionalEnv("BETTER_AUTH_JWT_EXPIRATION") ?? "15m",
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }),
      },
    }),
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
})

type ServerSession = Awaited<ReturnType<typeof auth.api.getSession>>
type SessionWithOnboarding = NonNullable<ServerSession> & {
  user: NonNullable<ServerSession>["user"] & {
    onboardingCompletedAt?: Date | null
  }
}
type SessionLike = {
  session: {
    userId: string
  }
  user: {
    email?: string | null
    role?: string | null
  }
}

const SESSION_CACHE_TTL_MS = 5_000
const SESSION_COOKIE_NAMES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
] as const

const sessionCache = new Map<string, { value: SessionWithOnboarding; expiresAtMs: number }>()
const sessionLookupInflight = new Map<string, Promise<SessionWithOnboarding | null>>()

function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const cookieValues = new Map<string, string>()

  for (const segment of cookieHeader.split(";")) {
    const [rawName, ...valueParts] = segment.trim().split("=")

    if (!rawName || valueParts.length === 0) {
      continue
    }

    cookieValues.set(rawName, valueParts.join("="))
  }

  return cookieValues
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function extractSessionToken(cookieValue: string): string | null {
  const decodedValue = decodeCookieValue(cookieValue)
  const [tokenCandidate] = decodedValue.split(".", 2)
  const token = tokenCandidate?.trim() ?? ""

  return token.length > 0 ? token : null
}

function readSessionTokenFromHeaders(requestHeaders: Headers): string | null {
  const cookieHeader = requestHeaders.get("cookie")

  if (!cookieHeader) {
    return null
  }

  const cookieValues = parseCookieHeader(cookieHeader)

  for (const cookieName of SESSION_COOKIE_NAMES) {
    const cookieValue = cookieValues.get(cookieName)

    if (!cookieValue) {
      continue
    }

    const token = extractSessionToken(cookieValue)

    if (token) {
      return token
    }
  }

  return null
}

function getCachedSession(sessionToken: string, nowMs: number): SessionWithOnboarding | null {
  const cached = sessionCache.get(sessionToken)

  if (!cached) {
    return null
  }

  if (cached.expiresAtMs <= nowMs) {
    sessionCache.delete(sessionToken)
    return null
  }

  return cached.value
}

function setCachedSession(sessionToken: string, sessionValue: SessionWithOnboarding) {
  const nowMs = Date.now()
  const sessionExpiryMs = sessionValue.session.expiresAt.getTime()
  const expiresAtMs = Math.min(sessionExpiryMs, nowMs + SESSION_CACHE_TTL_MS)

  if (expiresAtMs <= nowMs) {
    sessionCache.delete(sessionToken)
    return
  }

  sessionCache.set(sessionToken, {
    value: sessionValue,
    expiresAtMs,
  })
}

async function resolveSessionByToken(sessionToken: string): Promise<SessionWithOnboarding | null> {
  const rows = await db
    .select({
      sessionId: schema.session.id,
      sessionCreatedAt: schema.session.createdAt,
      sessionUpdatedAt: schema.session.updatedAt,
      userId: schema.session.userId,
      sessionExpiresAt: schema.session.expiresAt,
      sessionToken: schema.session.token,
      sessionIpAddress: schema.session.ipAddress,
      sessionUserAgent: schema.session.userAgent,
      sessionImpersonatedBy: schema.session.impersonatedBy,
      userCreatedAt: schema.user.createdAt,
      userUpdatedAt: schema.user.updatedAt,
      userEmail: schema.user.email,
      userEmailVerified: schema.user.emailVerified,
      userName: schema.user.name,
      userImage: schema.user.image,
      userBanned: schema.user.banned,
      userRole: schema.user.role,
      userBanReason: schema.user.banReason,
      userBanExpires: schema.user.banExpires,
      userOnboardingCompletedAt: schema.user.onboardingCompletedAt,
    })
    .from(schema.session)
    .innerJoin(schema.user, eq(schema.user.id, schema.session.userId))
    .where(eq(schema.session.token, sessionToken))
    .limit(1)

  const row = rows[0]

  if (!row) {
    return null
  }

  if (row.userBanned || row.sessionExpiresAt.getTime() <= Date.now()) {
    return null
  }

  return {
    session: {
      id: row.sessionId,
      createdAt: row.sessionCreatedAt,
      updatedAt: row.sessionUpdatedAt,
      userId: row.userId,
      expiresAt: row.sessionExpiresAt,
      token: row.sessionToken,
      ipAddress: row.sessionIpAddress,
      userAgent: row.sessionUserAgent,
      impersonatedBy: row.sessionImpersonatedBy,
    },
    user: {
      id: row.userId,
      createdAt: row.userCreatedAt,
      updatedAt: row.userUpdatedAt,
      email: row.userEmail,
      emailVerified: row.userEmailVerified,
      name: row.userName,
      image: row.userImage,
      banned: row.userBanned,
      role: row.userRole,
      banReason: row.userBanReason,
      banExpires: row.userBanExpires,
      onboardingCompletedAt: row.userOnboardingCompletedAt,
    },
  } as SessionWithOnboarding
}

async function resolveFastCookieSession(requestHeaders: Headers): Promise<SessionWithOnboarding | null> {
  const sessionToken = readSessionTokenFromHeaders(requestHeaders)

  if (!sessionToken) {
    return null
  }

  const nowMs = Date.now()
  const cached = getCachedSession(sessionToken, nowMs)

  if (cached) {
    return cached
  }

  const inflightLookup = sessionLookupInflight.get(sessionToken)

  if (inflightLookup) {
    return inflightLookup
  }

  const lookupPromise = resolveSessionByToken(sessionToken)
  sessionLookupInflight.set(sessionToken, lookupPromise)

  try {
    const resolved = await lookupPromise

    if (resolved) {
      setCachedSession(sessionToken, resolved)
    }

    return resolved
  } finally {
    sessionLookupInflight.delete(sessionToken)
  }
}

async function ensureAdminRoleFromSession<T extends SessionLike | null>(
  currentSession: T
): Promise<T> {
  if (!currentSession?.user?.email) {
    return currentSession
  }

  const normalizedEmail = currentSession.user.email.toLowerCase()

  if (!adminEmails.has(normalizedEmail)) {
    return currentSession
  }

  if (hasAdminRole(currentSession.user.role)) {
    return currentSession
  }

  const nextRole = ensureAdminRole(currentSession.user.role ?? "user")

  await db
    .update(schema.user)
    .set({
      role: nextRole,
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, currentSession.session.userId))

  currentSession.user.role = nextRole

  return currentSession
}

export async function getServerSession(): Promise<ServerSession> {
  const requestHeaders = await headers()
  return getServerSessionFromHeaders(requestHeaders)
}

export async function getServerSessionFromHeaders(requestHeaders: Headers): Promise<ServerSession> {
  const fastSession = await resolveFastCookieSession(requestHeaders)

  if (fastSession) {
    return ensureAdminRoleFromSession(fastSession)
  }

  const session = await auth.api.getSession({
    headers: requestHeaders,
  })

  return ensureAdminRoleFromSession(session)
}
