import { redirect } from "next/navigation"

import { getServerSession } from "@/app/lib/auth/server"
import { readOnboardingCompletedFromSession } from "@/app/lib/auth/session-onboarding"
import { getOnboardingStatus } from "@/app/lib/server/domain/onboarding/onboarding.domain"

export default async function RootPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/sign-in")
  }

  const onboardingCompletedFromSession = readOnboardingCompletedFromSession(session)
  const onboardingCompleted =
    onboardingCompletedFromSession ?? (await getOnboardingStatus(session.user.id)).completed

  redirect(onboardingCompleted ? "/career-path/salary-tracking" : "/onboarding")
}
