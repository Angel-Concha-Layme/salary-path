import { redirect } from "next/navigation"

import { AppShell } from "@/components/layout/app-shell"
import { readOnboardingCompletedFromSession } from "@/app/lib/auth/session-onboarding"
import { requireProtectedSession } from "@/app/lib/auth/guards"
import { normalizeRole } from "@/app/lib/auth/roles"
import { getOnboardingStatus } from "@/app/lib/server/domain/onboarding/onboarding.domain"

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireProtectedSession()
  const onboardingCompletedFromSession = readOnboardingCompletedFromSession(session)
  const onboardingCompleted =
    onboardingCompletedFromSession ?? (await getOnboardingStatus(session.user.id)).completed

  if (!onboardingCompleted) {
    redirect("/onboarding")
  }

  const userImage = (session.user as { image?: string | null }).image ?? null

  return (
    <AppShell
      role={normalizeRole(session.user.role)}
      userName={session.user.name ?? session.user.email}
      userEmail={session.user.email}
      userImage={userImage}
    >
      {children}
    </AppShell>
  )
}
