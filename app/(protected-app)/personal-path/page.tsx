import { RoutePlaceholder } from "@/components/layout/route-placeholder"

export default function PersonalPathPage() {
  return (
    <RoutePlaceholder
      routeKey="personalPath"
      access="protected"
      protectedRoute
    />
  )
}
