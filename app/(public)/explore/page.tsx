import { RoutePlaceholder } from "@/components/layout/route-placeholder"

export default function ExplorePage() {
  return (
    <RoutePlaceholder
      routeKey="explore"
      access="public"
      protectedRoute={false}
    />
  )
}
