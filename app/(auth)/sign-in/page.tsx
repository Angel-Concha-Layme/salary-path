import { redirect } from "next/navigation"

import { SignInScreen } from "@/app/(auth)/sign-in/_components/sign-in-screen"
import { getServerSession } from "@/app/lib/auth/server"
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

    const onboardingStatus = await getOnboardingStatus(session.user.id)
    redirect(onboardingStatus.completed ? "/career-path/salary-tracking" : "/onboarding")
  }

  return <SignInScreen callbackUrl={callbackUrl} />
}
