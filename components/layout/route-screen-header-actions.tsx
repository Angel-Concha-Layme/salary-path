"use client"

import type { FormEvent, ReactNode } from "react"
import { useState } from "react"
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

export function RouteScreenHeaderActions({
  settingsContent,
  className,
}: RouteScreenHeaderActionsProps) {
  const { dictionary } = useDictionary()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchPopoverOpen, setSearchPopoverOpen] = useState(false)
  const [searchNoResults, setSearchNoResults] = useState(false)

  const findFirstMatch = (root: HTMLElement, query: string): Range | null => {
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

    while (currentNode) {
      const text = currentNode.textContent ?? ""
      const start = text.toLocaleLowerCase().indexOf(normalizedQuery)

      if (start >= 0) {
        const range = document.createRange()
        range.setStart(currentNode, start)
        range.setEnd(currentNode, start + normalizedQuery.length)
        return range
      }

      currentNode = walker.nextNode()
    }

    return null
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (typeof window === "undefined") {
      return
    }

    const query = searchQuery.trim()

    if (!query) {
      setSearchNoResults(false)
      return
    }

    const routeScreenRoot = document.querySelector<HTMLElement>("[data-route-screen='true']")

    if (!routeScreenRoot) {
      setSearchNoResults(true)
      return
    }

    const matchRange = findFirstMatch(routeScreenRoot, query)

    if (!matchRange) {
      setSearchNoResults(true)
      return
    }

    setSearchNoResults(false)

    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(matchRange)

    matchRange.startContainer.parentElement?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    })

    setSearchPopoverOpen(false)
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

      <Popover open={searchPopoverOpen} onOpenChange={setSearchPopoverOpen}>
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
                onChange={(event) => setSearchQuery(event.target.value)}
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
