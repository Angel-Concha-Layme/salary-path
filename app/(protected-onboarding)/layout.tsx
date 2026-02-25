import { redirect } from "next/navigation"

import { requireProtectedSession } from "@/app/lib/auth/guards"
import { readOnboardingCompletedFromSession } from "@/app/lib/auth/session-onboarding"
import { getOnboardingStatus } from "@/app/lib/server/domain/onboarding/onboarding.domain"

export default async function ProtectedOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireProtectedSession()
  const onboardingCompletedFromSession = readOnboardingCompletedFromSession(session)
  const onboardingCompleted =
    onboardingCompletedFromSession ?? (await getOnboardingStatus(session.user.id)).completed

  if (onboardingCompleted) {
    redirect("/career-path/salary-tracking")
  }

  return <>{children}</>
}
