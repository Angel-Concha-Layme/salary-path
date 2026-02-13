import { createAuthClient } from "better-auth/react"
import { adminClient, jwtClient } from "better-auth/client/plugins"

function getAuthClientBaseUrl(): string {
  const publicBaseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim()

  if (publicBaseUrl) {
    return publicBaseUrl
  }

  const serverBaseUrl = process.env.BETTER_AUTH_URL?.trim()

  if (serverBaseUrl) {
    return serverBaseUrl
  }

  if (typeof window !== "undefined") {
    return window.location.origin
  }

  return "http://localhost:3001"
}

export const authClient = createAuthClient({
  baseURL: getAuthClientBaseUrl(),
  basePath: "/api/auth",
  plugins: [adminClient(), jwtClient()],
})
