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

const ROUTE_SCREEN_SEARCH_HIGHLIGHT_ATTRIBUTE = "data-route-screen-search-highlight"
const ROUTE_SCREEN_SEARCH_HIGHLIGHT_CLASS =
  "rounded-[2px] bg-primary/10 underline decoration-2 decoration-primary/70 underline-offset-[0.18em] dark:bg-primary/20 dark:decoration-primary/80"

interface SearchMatch {
  element: HTMLElement
}

interface TextNodeMatches {
  node: Text
  starts: number[]
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

  const clearSearchHighlights = useCallback((root: HTMLElement | null) => {
    if (!root) {
      return
    }

    const highlights = root.querySelectorAll<HTMLElement>(
      `mark[${ROUTE_SCREEN_SEARCH_HIGHLIGHT_ATTRIBUTE}='true']`
    )

    highlights.forEach((highlight) => {
      const parentNode = highlight.parentNode

      if (!parentNode) {
        return
      }

      parentNode.replaceChild(document.createTextNode(highlight.textContent ?? ""), highlight)
      parentNode.normalize()
    })
  }, [])

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
    const textNodeMatches: TextNodeMatches[] = []

    while (currentNode) {
      const textNode = currentNode as Text
      const normalizedText = textNode.data.toLocaleLowerCase()
      let start = normalizedText.indexOf(normalizedQuery)
      const starts: number[] = []

      while (start >= 0) {
        starts.push(start)
        start = normalizedText.indexOf(normalizedQuery, start + normalizedQuery.length)
      }

      if (starts.length > 0) {
        textNodeMatches.push({
          node: textNode,
          starts,
        })
      }

      currentNode = walker.nextNode()
    }

    for (let nodeIndex = textNodeMatches.length - 1; nodeIndex >= 0; nodeIndex -= 1) {
      const matchNode = textNodeMatches[nodeIndex]

      for (let startIndex = matchNode.starts.length - 1; startIndex >= 0; startIndex -= 1) {
        const start = matchNode.starts[startIndex]
        const range = document.createRange()
        range.setStart(matchNode.node, start)
        range.setEnd(matchNode.node, start + normalizedQuery.length)

        const highlightElement = document.createElement("mark")
        highlightElement.setAttribute(ROUTE_SCREEN_SEARCH_HIGHLIGHT_ATTRIBUTE, "true")
        highlightElement.className = ROUTE_SCREEN_SEARCH_HIGHLIGHT_CLASS
        range.surroundContents(highlightElement)
      }
    }

    return Array.from(
      root.querySelectorAll<HTMLElement>(`mark[${ROUTE_SCREEN_SEARCH_HIGHLIGHT_ATTRIBUTE}='true']`)
    ).map((element) => ({ element }))
  }, [])

  const runSearch = useCallback(
    (rawQuery: string, isSearchOpen: boolean): SearchMatch[] => {
      if (typeof window === "undefined") {
        return []
      }

      const query = rawQuery.trim()
      const routeScreenRoot = document.querySelector<HTMLElement>("[data-route-screen='true']")

      clearSearchHighlights(routeScreenRoot)

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
      return matches
    },
    [clearSearchHighlights, findMatches]
  )

  useEffect(
    () => () => {
      const routeScreenRoot = document.querySelector<HTMLElement>("[data-route-screen='true']")
      clearSearchHighlights(routeScreenRoot)
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
            className="h-8 w-8 border-0 bg-transparent text-black/70 shadow-none hover:bg-black/5 hover:text-black dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
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
            className="h-8 w-8 border-0 bg-transparent text-black/70 shadow-none hover:bg-black/5 hover:text-black disabled:opacity-40 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
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
            className="h-8 w-8 border-0 bg-transparent text-black/70 shadow-none hover:bg-black/5 hover:text-black dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
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
