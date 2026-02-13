import { RoutePlaceholder } from "@/components/layout/route-placeholder"

export default function SettingsPage() {
  return (
    <RoutePlaceholder
      routeKey="settings"
      access="protected"
      protectedRoute
    />
  )
}
