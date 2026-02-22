import type { QueryClient, QueryKey } from "@tanstack/react-query"

import { queryKeys } from "@/app/lib/services/query-keys"

export type CacheDomain =
  | "me"
  | "adminUsers"
  | "settings"
  | "profile"
  | "companies"
  | "roles"
  | "security"
  | "personalPath"
  | "onboarding"

type QueryKeyFactory = () => QueryKey

const domainInvalidationMap: Record<CacheDomain, readonly QueryKeyFactory[]> = {
  me: [queryKeys.me.root],
  adminUsers: [queryKeys.adminUsers.root],
  settings: [queryKeys.settings.root, queryKeys.me.root, queryKeys.profile.root],
  profile: [queryKeys.profile.root, queryKeys.me.root],
  companies: [queryKeys.companies.root, queryKeys.personalPath.root],
  roles: [queryKeys.roles.root],
  security: [queryKeys.security.root],
  personalPath: [
    queryKeys.personalPath.root,
    queryKeys.profile.root,
    queryKeys.companies.root,
    queryKeys.roles.root,
  ],
  onboarding: [
    queryKeys.onboarding.root,
    queryKeys.me.root,
    queryKeys.profile.root,
    queryKeys.settings.root,
    queryKeys.personalPath.root,
    queryKeys.companies.root,
    queryKeys.roles.root,
  ],
}

export async function invalidateDomain(queryClient: QueryClient, domain: CacheDomain) {
  const keyFactories = domainInvalidationMap[domain]

  await Promise.all(
    keyFactories.map((factory) =>
      queryClient.invalidateQueries({
        queryKey: factory(),
      })
    )
  )
}
