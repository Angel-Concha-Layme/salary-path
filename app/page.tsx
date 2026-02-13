import { redirect } from "next/navigation"

import { getServerSession } from "@/app/lib/auth/server"
import { getOnboardingStatus } from "@/app/lib/server/domain/onboarding/onboarding.domain"

export default async function RootPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/sign-in")
  }

  const onboardingStatus = await getOnboardingStatus(session.user.id)

  redirect(onboardingStatus.completed ? "/personal-path" : "/onboarding")
}
