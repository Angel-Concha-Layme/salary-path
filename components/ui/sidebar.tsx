"use client"

import * as React from "react"
import { PanelLeftIcon } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const SIDEBAR_WIDTH = "12rem"
const SIDEBAR_WIDTH_ICON = "3.75rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarState = "expanded" | "collapsed"

interface SidebarContextValue {
  state: SidebarState
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  openMobile: boolean
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)")
    const onChange = () => {
      setIsMobile(media.matches)
    }

    onChange()
    media.addEventListener("change", onChange)

    return () => {
      media.removeEventListener("change", onChange)
    }
  }, [])

  return isMobile
}

function setOpenValue(
  nextValue: boolean | ((current: boolean) => boolean),
  current: boolean
): boolean {
  if (typeof nextValue === "function") {
    return nextValue(current)
  }

  return nextValue
}

interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const [_open, _setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)
  const isMobile = useIsMobile()

  const open = openProp ?? _open

  const setOpen = React.useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (value) => {
      const next = setOpenValue(value, open)

      if (openProp === undefined) {
        _setOpen(next)
      }

      onOpenChange?.(next)
    },
    [open, openProp, onOpenChange]
  )

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((current) => !current)
      return
    }

    setOpen((current) => !current)
  }, [isMobile, setOpen])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== SIDEBAR_KEYBOARD_SHORTCUT ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return
      }

      const target = event.target as HTMLElement | null
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (isTextInput) {
        return
      }

      event.preventDefault()
      toggleSidebar()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [toggleSidebar])

  const state: SidebarState = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextValue>(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, isMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-provider"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
            ...style,
          } as React.CSSProperties
        }
        className={cn("group/sidebar-wrapper flex min-h-screen min-w-0 w-full", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function useSidebar() {
  const context = React.useContext(SidebarContext)

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

interface SidebarProps extends React.ComponentProps<"aside"> {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "icon",
  className,
  children,
  ...props
}: SidebarProps) {
  const { state, openMobile, setOpenMobile } = useSidebar()

  const widthClassName =
    collapsible === "none"
      ? "w-[var(--sidebar-width)]"
      : state === "collapsed"
        ? "w-[var(--sidebar-width-icon)]"
        : "w-[var(--sidebar-width)]"

  return (
    <>
      <aside
        data-slot="sidebar"
        data-side={side}
        data-variant={variant}
        data-state={state}
        data-collapsible={collapsible}
        className={cn(
          "relative hidden shrink-0 border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col",
          side === "left" ? "border-r" : "border-l",
          "transition-[width] duration-200 ease-linear",
          widthClassName,
          className
        )}
        {...props}
      >
        {children}
      </aside>

      <aside
        data-slot="sidebar-mobile"
        data-mobile-open={openMobile ? "true" : "false"}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width-mobile)] border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition-transform lg:hidden",
          openMobile ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">{children}</div>
      </aside>

      {openMobile ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpenMobile(false)}
        />
      ) : null}
    </>
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex shrink-0 flex-col gap-2 border-b border-sidebar-border p-2", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-auto shrink-0 border-t border-sidebar-border p-2", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex-1 overflow-x-hidden overflow-y-auto p-2", className)}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="sidebar-group"
      className={cn("space-y-1.5 py-1", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="sidebar-group-label"
      className={cn(
        "px-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group-content" className={cn("space-y-1", className)} {...props} />
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("space-y-1", className)} {...props} />
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("relative", className)} {...props} />
}

interface SidebarMenuButtonProps extends React.ComponentProps<"button"> {
  asChild?: boolean
  isActive?: boolean
}

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  className,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive ? "true" : "false"}
      className={cn(
        "flex h-9 w-full min-w-0 items-center gap-2 overflow-hidden rounded-xl border px-2 text-sm transition-colors",
        isActive
          ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          : "border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent",
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn("min-h-screen min-w-0 flex-1", className)}
      {...props}
    />
  )
}

function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Toggle sidebar"
      className={cn(
        "rounded-full !border-sidebar-border !bg-sidebar !text-sidebar-foreground shadow-sm hover:!bg-sidebar-accent hover:!text-sidebar-foreground",
        className
      )}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeftIcon className="size-5 rtl:rotate-180" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label="Toggle sidebar"
      onClick={toggleSidebar}
      className={cn(
        "hover:bg-sidebar-accent absolute inset-y-0 right-[-8px] z-20 hidden w-4 rounded-sm lg:block",
        className
      )}
      {...props}
    />
  )
}

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
}
