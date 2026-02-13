"use client"

import { useMemo } from "react"
import type { ForwardedRef } from "react"

export function useForwardedRef<T>(forwardedRef: ForwardedRef<T>) {
  return useMemo(() => {
    if (typeof forwardedRef === "function") {
      return (value: T | null) => forwardedRef(value)
    }

    return forwardedRef
  }, [forwardedRef])
}
