"use client"

import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type MutationFunction,
  type UseMutationOptions,
} from "@tanstack/react-query"

import { invalidateDomain, type CacheDomain } from "@/app/lib/services/cache-invalidation"
import { ApiClientError } from "@/app/types/api"

interface UseDomainMutationOptions<TData, TVariables, TContext>
  extends Omit<
    UseMutationOptions<TData, ApiClientError, TVariables, TContext>,
    "mutationFn" | "onSuccess"
  > {
  domain: CacheDomain
  mutationFn: MutationFunction<TData, TVariables>
  invalidate?: (
    queryClient: QueryClient,
    data: TData,
    variables: TVariables,
    context: TContext | undefined
  ) => void | Promise<void>
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void | Promise<void>
}

export function useDomainMutation<TData, TVariables = void, TContext = unknown>({
  domain,
  mutationFn,
  invalidate,
  onSuccess: userOnSuccess,
  ...options
}: UseDomainMutationOptions<TData, TVariables, TContext>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn,
    async onSuccess(data, variables, context) {
      if (invalidate) {
        await invalidate(queryClient, data, variables, context)
      } else {
        await invalidateDomain(queryClient, domain)
      }
      await userOnSuccess?.(data, variables, context)
    },
  })
}
