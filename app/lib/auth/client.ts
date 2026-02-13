import { createAuthClient } from "better-auth/react"
import { adminClient, jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3001",
  plugins: [adminClient(), jwtClient()],
})
