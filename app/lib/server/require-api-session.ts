import { createRemoteJWKSet, jwtVerify } from "jose"

import { getServerSessionFromHeaders } from "@/app/lib/auth/server"
import { normalizeRole } from "@/app/lib/auth/roles"
import { ApiError } from "@/app/lib/server/api-error"

export interface ApiSessionUser {
  id: string
  email: string
  name: string
  role: string
}

export interface ApiSessionContext {
  source: "jwt" | "cookie"
  user: ApiSessionUser
}

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null

function getBetterAuthUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3001"
}

function getJwtIssuer(): string | undefined {
  return process.env.BETTER_AUTH_JWT_ISSUER
}

function getJwtAudience(): string | string[] | undefined {
  const audience = process.env.BETTER_AUTH_JWT_AUDIENCE

  if (!audience) {
    return undefined
  }

  if (audience.includes(",")) {
    return audience
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  }

  return audience
}

function getJwks() {
  if (jwksCache) {
    return jwksCache
  }

  const jwksUrl = new URL("/api/auth/jwks", getBetterAuthUrl())
  jwksCache = createRemoteJWKSet(jwksUrl)
  return jwksCache
}

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return null
  }

  const [type, token] = authorization.split(" ")

  if (type?.toLowerCase() !== "bearer" || !token) {
    return null
  }

  return token
}

async function resolveJwtSession(token: string): Promise<ApiSessionContext | null> {
  try {
    const issuer = getJwtIssuer()
    const audience = getJwtAudience()

    const verification = await jwtVerify(token, getJwks(), {
      issuer,
      audience,
    })

    const payload = verification.payload
    const email = payload.email

    if (typeof email !== "string" || email.length === 0) {
      throw new ApiError(401, "UNAUTHORIZED", "JWT payload does not include email")
    }

    const role = typeof payload.role === "string" ? payload.role : "user"

    return {
      source: "jwt",
      user: {
        id: typeof payload.id === "string" ? payload.id : payload.sub ?? "",
        email,
        name: typeof payload.name === "string" ? payload.name : email,
        role: normalizeRole(role),
      },
    }
  } catch {
    return null
  }
}

async function resolveCookieSession(request: Request): Promise<ApiSessionContext | null> {
  const session = await getServerSessionFromHeaders(request.headers)

  if (!session?.user?.email) {
    return null
  }

  return {
    source: "cookie",
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: normalizeRole(session.user.role),
    },
  }
}

export async function requireApiSession(request: Request): Promise<ApiSessionContext> {
  const bearerToken = readBearerToken(request)

  if (bearerToken) {
    const jwtSession = await resolveJwtSession(bearerToken)

    if (jwtSession) {
      return jwtSession
    }

    throw new ApiError(401, "UNAUTHORIZED", "Invalid bearer token")
  }

  const cookieSession = await resolveCookieSession(request)

  if (cookieSession) {
    return cookieSession
  }

  throw new ApiError(401, "UNAUTHORIZED", "Authentication required")
}
