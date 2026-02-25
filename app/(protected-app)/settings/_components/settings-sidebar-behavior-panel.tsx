import type { Dictionary } from "@/app/lib/i18n/get-dictionary"
import type { SidebarGroupBehavior } from "@/app/lib/features/sidebar-group-behavior"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SettingsSidebarBehaviorPanelProps {
  sidebar: Dictionary["settingsPage"]["sidebar"]
  sidebarBehavior: SidebarGroupBehavior
  onSidebarBehaviorChange: (value: SidebarGroupBehavior) => void
}

export function SettingsSidebarBehaviorPanel({
  sidebar,
  sidebarBehavior,
  onSidebarBehaviorChange,
}: SettingsSidebarBehaviorPanelProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">{sidebar.title}</h2>
        <p className="text-sm text-muted-foreground">{sidebar.description}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant={sidebarBehavior === "all_collapsed" ? "default" : "outline"}
            className={cn(
              "h-auto justify-start px-3 py-2 text-left",
              sidebarBehavior === "all_collapsed" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => onSidebarBehaviorChange("all_collapsed")}
            size="sm"
          >
            {sidebar.allCollapsed}
          </Button>

          <Button
            type="button"
            variant={sidebarBehavior === "all_expanded" ? "default" : "outline"}
            className={cn(
              "h-auto justify-start px-3 py-2 text-left",
              sidebarBehavior === "all_expanded" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => onSidebarBehaviorChange("all_expanded")}
            size="sm"
          >
            {sidebar.allExpanded}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {sidebarBehavior === "all_collapsed" ? sidebar.collapsedHint : sidebar.expandedHint}
        </p>
      </div>
    </section>
  )
}
