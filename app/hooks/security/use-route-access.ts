"use client"

import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"

import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import type { RouteAccessStatusResponse } from "@/app/lib/models/security/route-access.model"
import type { RouteStepUpKey } from "@/app/lib/security/route-protection-config"
import { queryKeys } from "@/app/lib/services/query-keys"
import { routeAccessService } from "@/app/lib/services/security/route-access.service"

interface RouteAccessStatusQueryOptions {
  initialData?: RouteAccessStatusResponse
}

export function getRouteAccessStatusQueryOptions(
  routeKey: RouteStepUpKey,
  options: RouteAccessStatusQueryOptions = {}
) {
  return queryOptions({
    queryKey: queryKeys.security.routeAccess.status(routeKey),
    queryFn: ({ signal }) => routeAccessService.getRouteAccessStatus(routeKey, { signal }),
    staleTime: 1000 * 10,
    initialData: options.initialData,
  })
}

export function useRouteAccessStatusQuery(
  routeKey: RouteStepUpKey,
  options: RouteAccessStatusQueryOptions = {}
) {
  return useQuery(getRouteAccessStatusQueryOptions(routeKey, options))
}

export function useSendRouteEmailOtpMutation(routeKey: RouteStepUpKey) {
  const queryClient = useQueryClient()

  return useDomainMutation({
    domain: "security",
    mutationFn: () => routeAccessService.sendRouteEmailOtp(routeKey),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.security.routeAccess.status(routeKey),
      })
    },
  })
}

export function useVerifyRouteEmailOtpMutation(routeKey: RouteStepUpKey) {
  const queryClient = useQueryClient()

  return useDomainMutation({
    domain: "security",
    mutationFn: (code: string) => routeAccessService.verifyRouteEmailOtp(routeKey, code),
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.security.routeAccess.status(routeKey),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.comparison.root(),
        }),
      ])
    },
  })
}

