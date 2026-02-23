"use client"

import type { FormEvent, ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { BellIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface RouteScreenHeaderActionsProps {
  settingsContent?: ReactNode
  className?: string
}

const ROUTE_SCREEN_SEARCH_HIGHLIGHT = "route-screen-search"
const ROUTE_SCREEN_SEARCH_HIGHLIGHT_STYLE_ID = "route-screen-search-highlight-style"
const LEGACY_ROUTE_SCREEN_SEARCH_HIGHLIGHT_ATTRIBUTE = "data-route-screen-search-highlight"
const ROUTE_SCREEN_ACTION_ICON_BUTTON_CLASS_NAME =
  "h-8 w-8 border-0 bg-transparent text-[color-mix(in_oklch,var(--ui-accent-current)_68%,black)] shadow-none hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_14%,transparent)] hover:text-[color-mix(in_oklch,var(--ui-accent-current)_78%,black)] disabled:opacity-40"

interface SearchMatch {
  range: Range
  element: HTMLElement
}

type HighlightConstructor = new (...ranges: Range[]) => unknown

type HighlightRegistry = {
  delete: (name: string) => void
  set: (name: string, value: unknown) => void
}

function getHighlightApi():
  | {
      Highlight: HighlightConstructor
      highlights: HighlightRegistry
    }
  | null {
  if (typeof window === "undefined" || typeof CSS === "undefined") {
    return null
  }

  const MaybeHighlight = (window as Window & { Highlight?: HighlightConstructor }).Highlight
  const maybeHighlights = (CSS as typeof CSS & { highlights?: HighlightRegistry }).highlights

  if (!MaybeHighlight || !maybeHighlights) {
    return null
  }

  return {
    Highlight: MaybeHighlight,
    highlights: maybeHighlights,
  }
}

function isIgnoredSearchTagName(tagName: string): boolean {
  return tagName === "SCRIPT" || tagName === "STYLE" || tagName === "NOSCRIPT" || tagName === "TEXTAREA"
}

export function RouteScreenHeaderActions({
  settingsContent,
  className,
}: RouteScreenHeaderActionsProps) {
  const { dictionary } = useDictionary()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchPopoverOpen, setSearchPopoverOpen] = useState(false)
  const [searchNoResults, setSearchNoResults] = useState(false)
  const searchMatchesRef = useRef<SearchMatch[]>([])

  const ensureHighlightStyle = useCallback(() => {
    if (typeof document === "undefined") {
      return
    }

    if (document.getElementById(ROUTE_SCREEN_SEARCH_HIGHLIGHT_STYLE_ID)) {
      return
    }

    const styleElement = document.createElement("style")
    styleElement.id = ROUTE_SCREEN_SEARCH_HIGHLIGHT_STYLE_ID
    styleElement.textContent = `
::highlight(${ROUTE_SCREEN_SEARCH_HIGHLIGHT}) {
  background-color: color-mix(in oklch, var(--ui-accent-current) 22%, transparent);
}

.dark ::highlight(${ROUTE_SCREEN_SEARCH_HIGHLIGHT}) {
  background-color: color-mix(in oklch, var(--ui-accent-current) 32%, transparent);
}
`

    document.head.appendChild(styleElement)
  }, [])

  const clearSearchHighlights = useCallback(() => {
    const highlightApi = getHighlightApi()
    highlightApi?.highlights.delete(ROUTE_SCREEN_SEARCH_HIGHLIGHT)
  }, [])

  const clearLegacySearchHighlightWrappers = useCallback((root: HTMLElement | null) => {
    if (!root) {
      return
    }

    const wrappers = root.querySelectorAll<HTMLElement>(
      `span[${LEGACY_ROUTE_SCREEN_SEARCH_HIGHLIGHT_ATTRIBUTE}='true'], mark[${LEGACY_ROUTE_SCREEN_SEARCH_HIGHLIGHT_ATTRIBUTE}='true']`
    )

    wrappers.forEach((wrapper) => {
      const parentNode = wrapper.parentNode

      if (!parentNode) {
        return
      }

      parentNode.replaceChild(document.createTextNode(wrapper.textContent ?? ""), wrapper)
      parentNode.normalize()
    })
  }, [])

  const applySearchHighlights = useCallback(
    (matches: SearchMatch[]) => {
      const highlightApi = getHighlightApi()

      if (!highlightApi) {
        return
      }

      ensureHighlightStyle()
      highlightApi.highlights.delete(ROUTE_SCREEN_SEARCH_HIGHLIGHT)

      if (!matches.length) {
        return
      }

      highlightApi.highlights.set(
        ROUTE_SCREEN_SEARCH_HIGHLIGHT,
        new highlightApi.Highlight(...matches.map((match) => match.range))
      )
    },
    [ensureHighlightStyle]
  )

  const findMatches = useCallback((root: HTMLElement, query: string): SearchMatch[] => {
    const visibilityCache = new WeakMap<HTMLElement, boolean>()

    const isVisibleForSearch = (element: HTMLElement): boolean => {
      const cached = visibilityCache.get(element)
      if (cached !== undefined) {
        return cached
      }

      const parent = element.parentElement
      if (parent && !isVisibleForSearch(parent)) {
        visibilityCache.set(element, false)
        return false
      }

      const style = window.getComputedStyle(element)
      const isVisible =
        !element.hasAttribute("hidden") &&
        element.getAttribute("aria-hidden") !== "true" &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.visibility !== "collapse" &&
        style.contentVisibility !== "hidden"

      visibilityCache.set(element, isVisible)
      return isVisible
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const value = node.textContent?.trim()

        if (!value) {
          return NodeFilter.FILTER_REJECT
        }

        const parentElement = node.parentElement

        if (!parentElement) {
          return NodeFilter.FILTER_REJECT
        }

        if (isIgnoredSearchTagName(parentElement.tagName)) {
          return NodeFilter.FILTER_REJECT
        }

        if (parentElement.closest("[data-route-screen-search-ignore='true']")) {
          return NodeFilter.FILTER_REJECT
        }

        if (!isVisibleForSearch(parentElement)) {
          return NodeFilter.FILTER_REJECT
        }

        return NodeFilter.FILTER_ACCEPT
      },
    })

    let currentNode = walker.nextNode()
    const normalizedQuery = query.toLocaleLowerCase()
    const matches: SearchMatch[] = []

    while (currentNode) {
      const text = currentNode.textContent ?? ""
      const normalizedText = text.toLocaleLowerCase()
      let start = normalizedText.indexOf(normalizedQuery)
      const parentElement = currentNode.parentElement

      while (start >= 0 && parentElement) {
        const range = document.createRange()
        range.setStart(currentNode, start)
        range.setEnd(currentNode, start + normalizedQuery.length)

        matches.push({
          range,
          element: parentElement,
        })

        start = normalizedText.indexOf(normalizedQuery, start + normalizedQuery.length)
      }

      currentNode = walker.nextNode()
    }

    return matches
  }, [])

  const runSearch = useCallback(
    (rawQuery: string, isSearchOpen: boolean): SearchMatch[] => {
      if (typeof window === "undefined") {
        return []
      }

      const query = rawQuery.trim()
      const routeScreenRoot = document.querySelector<HTMLElement>("[data-route-screen='true']")

      clearLegacySearchHighlightWrappers(routeScreenRoot)
      clearSearchHighlights()

      if (!isSearchOpen || !query) {
        searchMatchesRef.current = []
        setSearchNoResults(false)
        return []
      }

      if (!routeScreenRoot) {
        searchMatchesRef.current = []
        setSearchNoResults(true)
        return []
      }

      const matches = findMatches(routeScreenRoot, query)
      searchMatchesRef.current = matches
      setSearchNoResults(matches.length === 0)
      applySearchHighlights(matches)
      return matches
    },
    [applySearchHighlights, clearLegacySearchHighlightWrappers, clearSearchHighlights, findMatches]
  )

  useEffect(
    () => () => {
      clearSearchHighlights()
    },
    [clearSearchHighlights]
  )

  const handleSearchPopoverChange = (nextOpen: boolean) => {
    setSearchPopoverOpen(nextOpen)
    runSearch(searchQuery, nextOpen)
  }

  const handleSearchInputChange = (nextQuery: string) => {
    setSearchQuery(nextQuery)
    runSearch(nextQuery, searchPopoverOpen)
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!searchPopoverOpen) {
      return
    }

    const matches = runSearch(searchQuery, searchPopoverOpen)
    const firstMatch = matches[0]

    if (!firstMatch) {
      return
    }

    firstMatch.element.scrollIntoView({
      block: "center",
      behavior: "smooth",
    })
  }

  return (
    <div className={cn("ml-auto flex items-center gap-1.5", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={dictionary.navigation.notifications}
            className={ROUTE_SCREEN_ACTION_ICON_BUTTON_CLASS_NAME}
          >
            <BellIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 rounded-xl border border-border/70 p-3 shadow-none">
          <p className="text-xs font-medium text-muted-foreground">
            {dictionary.navigation.notifications}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{dictionary.common.comingSoon}</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={dictionary.navigation.filters}
            disabled={!settingsContent}
            className={ROUTE_SCREEN_ACTION_ICON_BUTTON_CLASS_NAME}
          >
            <SlidersHorizontalIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        {settingsContent ? (
          <PopoverContent
            align="end"
            className="w-[280px] rounded-xl border border-border/70 p-3 shadow-none"
          >
            {settingsContent}
          </PopoverContent>
        ) : null}
      </Popover>

      <Popover open={searchPopoverOpen} onOpenChange={handleSearchPopoverChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={dictionary.navigation.search}
            className={ROUTE_SCREEN_ACTION_ICON_BUTTON_CLASS_NAME}
          >
            <SearchIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[260px] rounded-xl border border-border/70 p-3 shadow-none">
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{dictionary.navigation.search}</p>
            <div className="flex items-center gap-2">
              <Input
                value={searchQuery}
                onChange={(event) => handleSearchInputChange(event.target.value)}
                placeholder={dictionary.navigation.search}
                className="h-8"
              />
              <Button type="submit" variant="outline" size="sm" className="shrink-0">
                {dictionary.navigation.search}
              </Button>
            </div>
            {searchNoResults ? (
              <p className="text-xs text-muted-foreground">{dictionary.common.noResults}</p>
            ) : null}
          </form>
        </PopoverContent>
      </Popover>
    </div>
  )
}
