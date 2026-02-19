import { requireProtectedSession } from "@/app/lib/auth/guards"
import { getRouteAccessStatusForUser } from "@/app/lib/server/domain/security/route-email-otp.domain"
import { RouteEmailOtpGate } from "@/components/security/route-email-otp-gate"

export default async function ComparisonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireProtectedSession("/comparison")
  const status = await getRouteAccessStatusForUser(session.user.id, "comparison")

  if (!status.verified) {
    return (
      <RouteEmailOtpGate
        routeKey="comparison"
        userEmail={session.user.email}
        initialStatus={status}
      />
    )
  }

  return <>{children}</>
}

