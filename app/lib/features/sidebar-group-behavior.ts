export type SidebarGroupBehavior = "all_collapsed" | "all_expanded"

export const SIDEBAR_GROUP_BEHAVIOR_STORAGE_KEY =
  "capital-path.sidebar.group-behavior"

const SIDEBAR_GROUP_BEHAVIOR_EVENT =
  "capital-path:sidebar-group-behavior-changed"

export const DEFAULT_SIDEBAR_GROUP_BEHAVIOR: SidebarGroupBehavior = "all_collapsed"

function isSidebarGroupBehavior(value: unknown): value is SidebarGroupBehavior {
  return value === "all_collapsed" || value === "all_expanded"
}

export function getSidebarGroupBehaviorFromStorage(): SidebarGroupBehavior {
  if (typeof window === "undefined") {
    return DEFAULT_SIDEBAR_GROUP_BEHAVIOR
  }

  try {
    const value = window.localStorage.getItem(SIDEBAR_GROUP_BEHAVIOR_STORAGE_KEY)

    if (isSidebarGroupBehavior(value)) {
      return value
    }
  } catch {
    // Ignore blocked storage access.
  }

  return DEFAULT_SIDEBAR_GROUP_BEHAVIOR
}

export function setSidebarGroupBehaviorInStorage(
  value: SidebarGroupBehavior
): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(SIDEBAR_GROUP_BEHAVIOR_STORAGE_KEY, value)
  } catch {
    // Ignore blocked storage writes.
  }

  window.dispatchEvent(
    new CustomEvent<SidebarGroupBehavior>(SIDEBAR_GROUP_BEHAVIOR_EVENT, {
      detail: value,
    })
  )
}

export function subscribeSidebarGroupBehavior(
  listener: (value: SidebarGroupBehavior) => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const onBehaviorChange = (event: Event) => {
    const customEvent = event as CustomEvent<SidebarGroupBehavior>

    if (isSidebarGroupBehavior(customEvent.detail)) {
      listener(customEvent.detail)
      return
    }

    listener(getSidebarGroupBehaviorFromStorage())
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== SIDEBAR_GROUP_BEHAVIOR_STORAGE_KEY) {
      return
    }

    listener(getSidebarGroupBehaviorFromStorage())
  }

  window.addEventListener(SIDEBAR_GROUP_BEHAVIOR_EVENT, onBehaviorChange)
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener(SIDEBAR_GROUP_BEHAVIOR_EVENT, onBehaviorChange)
    window.removeEventListener("storage", onStorage)
  }
}
