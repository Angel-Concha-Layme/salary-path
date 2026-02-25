import { redirect } from "next/navigation"

import { SignInScreen } from "@/app/(auth)/sign-in/_components/sign-in-screen"
import { getServerSession } from "@/app/lib/auth/server"
import { readOnboardingCompletedFromSession } from "@/app/lib/auth/session-onboarding"
import { getOnboardingStatus } from "@/app/lib/server/domain/onboarding/onboarding.domain"

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams
  const session = await getServerSession()
  const callbackUrl = resolvedSearchParams.callbackUrl

  if (session) {
    if (callbackUrl) {
      redirect(callbackUrl)
    }

    const onboardingCompletedFromSession = readOnboardingCompletedFromSession(session)
    const onboardingCompleted =
      onboardingCompletedFromSession ?? (await getOnboardingStatus(session.user.id)).completed
    redirect(onboardingCompleted ? "/career-path/salary-tracking" : "/onboarding")
  }

  return <SignInScreen callbackUrl={callbackUrl} />
}
