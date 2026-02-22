import { redirect } from "next/navigation"

import { requireProtectedSession } from "@/app/lib/auth/guards"
import { getOnboardingStatus } from "@/app/lib/server/domain/onboarding/onboarding.domain"

export default async function ProtectedOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireProtectedSession()
  const onboardingStatus = await getOnboardingStatus(session.user.id)

  if (onboardingStatus.completed) {
    redirect("/career-path/salary-tracking")
  }

  return <>{children}</>
}
