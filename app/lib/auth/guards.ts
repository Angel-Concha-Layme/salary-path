import { redirect } from "next/navigation"

import { hasAdminRole } from "@/app/lib/auth/roles"
import { getServerSession } from "@/app/lib/auth/server"

function buildSignInUrl(callbackUrl?: string): string {
  const url = new URL("/sign-in", "http://localhost")

  if (callbackUrl) {
    url.searchParams.set("callbackUrl", callbackUrl)
  }

  return `${url.pathname}${url.search}`
}

export async function requireProtectedSession(callbackUrl?: string) {
  const session = await getServerSession()

  if (!session) {
    redirect(buildSignInUrl(callbackUrl))
  }

  return session
}

export async function requireAdminSession(callbackUrl?: string) {
  const session = await getServerSession()

  if (!session) {
    redirect(buildSignInUrl(callbackUrl))
  }

  if (!hasAdminRole(session.user.role)) {
    redirect("/403")
  }

  return session
}
