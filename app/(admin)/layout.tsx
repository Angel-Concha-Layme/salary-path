import { AppShell } from "@/components/layout/app-shell"
import { requireAdminSession } from "@/app/lib/auth/guards"
import { normalizeRole } from "@/app/lib/auth/roles"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdminSession()

  return (
    <AppShell
      role={normalizeRole(session.user.role)}
      userName={session.user.name ?? session.user.email}
      userEmail={session.user.email}
    >
      {children}
    </AppShell>
  )
}
