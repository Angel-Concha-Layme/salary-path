import { eq } from "drizzle-orm"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins/admin"
import { jwt } from "better-auth/plugins/jwt"
import { headers } from "next/headers"

import { db } from "@/app/lib/db/client"
import * as schema from "@/app/lib/db/schema"
import { ensureAdminRole, hasAdminRole } from "@/app/lib/auth/roles"

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
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  socialProviders,
  plugins: [
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

type SessionLike = {
  session: {
    userId: string
  }
  user: {
    email?: string | null
    role?: string | null
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

export async function getServerSession() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({
    headers: requestHeaders,
  })

  return ensureAdminRoleFromSession(session)
}

export async function getServerSessionFromHeaders(requestHeaders: Headers) {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  })

  return ensureAdminRoleFromSession(session)
}
