import { RoutePlaceholder } from "@/components/layout/route-placeholder"

export default function AdminUserDetailPage() {
  return (
    <RoutePlaceholder
      routeKey="adminUserDetail"
      access="admin"
      protectedRoute
    />
  )
}
