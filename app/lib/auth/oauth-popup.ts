export const OAUTH_POPUP_COMPLETE_MESSAGE = "salary-path:oauth-popup-complete" as const

export type OAuthPopupCompleteMessage = {
  type: typeof OAUTH_POPUP_COMPLETE_MESSAGE
  target: string
}

export function getSafeInternalTarget(
  target: string | null | undefined,
  fallback = "/personal-path"
): string {
  if (!target) {
    return fallback
  }

  if (!target.startsWith("/") || target.startsWith("//")) {
    return fallback
  }

  return target
}

export function isOAuthPopupCompleteMessage(
  value: unknown
): value is OAuthPopupCompleteMessage {
  if (!value || typeof value !== "object") {
    return false
  }

  const message = value as Record<string, unknown>

  return (
    message.type === OAUTH_POPUP_COMPLETE_MESSAGE &&
    typeof message.target === "string"
  )
}
