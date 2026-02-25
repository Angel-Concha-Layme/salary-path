export function readOnboardingCompletedFromSession(
  session: unknown
): boolean | null {
  if (!session || typeof session !== "object") {
    return null
  }

  const user = (session as { user?: unknown }).user

  if (!user || typeof user !== "object") {
    return null
  }

  if (!Object.prototype.hasOwnProperty.call(user, "onboardingCompletedAt")) {
    return null
  }

  const onboardingCompletedAt = (user as { onboardingCompletedAt?: unknown }).onboardingCompletedAt

  if (typeof onboardingCompletedAt === "undefined") {
    return null
  }

  if (onboardingCompletedAt === null) {
    return false
  }

  if (onboardingCompletedAt instanceof Date) {
    return !Number.isNaN(onboardingCompletedAt.getTime())
  }

  if (typeof onboardingCompletedAt === "number") {
    return onboardingCompletedAt > 0
  }

  if (typeof onboardingCompletedAt === "string") {
    return onboardingCompletedAt.trim().length > 0
  }

  return Boolean(onboardingCompletedAt)
}
