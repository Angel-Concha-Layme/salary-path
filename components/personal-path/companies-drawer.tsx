"use client"

import type { CSSProperties, ReactNode } from "react"
import { useMemo } from "react"
import { XIcon } from "lucide-react"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import type { PersonalPathCompanyTableRow } from "@/app/lib/models/personal-path/personal-path-chart.model"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type CompaniesDrawerSide = "right" | "left"

interface CompaniesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: PersonalPathCompanyTableRow | null
  events: PathCompanyEventsEntity[]
  side?: CompaniesDrawerSide
  size?: string | number
}

interface DrawerDetailItem {
  label: string
  value: ReactNode
  mono?: boolean
  muted?: boolean
}

function normalizeSize(size: string | number | undefined): string {
  if (typeof size === "number" && Number.isFinite(size) && size > 0) {
    return `${size}px`
  }

  if (typeof size === "string" && size.trim().length > 0) {
    return size.trim()
  }

  return "30%"
}

function hexToRgb(hexColor: string): { red: number; green: number; blue: number } | null {
  const normalized = hexColor.trim().replace("#", "")

  if (![3, 6].includes(normalized.length)) {
    return null
  }

  const expanded = normalized.length === 3
    ? normalized.split("").map((segment) => `${segment}${segment}`).join("")
    : normalized

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return null
  }

  return { red, green, blue }
}

function toLinearChannel(value: number): number {
  const normalized = value / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

function getRelativeLuminance(rgb: { red: number; green: number; blue: number }): number {
  return (
    0.2126 * toLinearChannel(rgb.red) +
    0.7152 * toLinearChannel(rgb.green) +
    0.0722 * toLinearChannel(rgb.blue)
  )
}

function getContrastRatio(luminanceA: number, luminanceB: number): number {
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

function getContrastTextColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor)

  if (!rgb) {
    return "#0f172a"
  }

  const backgroundLuminance = getRelativeLuminance(rgb)
  const darkTextLuminance = getRelativeLuminance({ red: 15, green: 23, blue: 42 })
  const lightTextLuminance = getRelativeLuminance({ red: 248, green: 250, blue: 252 })

  const darkContrast = getContrastRatio(backgroundLuminance, darkTextLuminance)
  const lightContrast = getContrastRatio(backgroundLuminance, lightTextLuminance)

  return darkContrast >= lightContrast ? "#0f172a" : "#f8fafc"
}

function formatDateValue(value: string | null, locale: string): string {
  if (!value) {
    return "—"
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed)
}

function formatAmount(
  locale: string,
  currency: string,
  amount: number,
  maximumFractionDigits: number
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits,
    }).format(amount)
  } catch {
    return `${amount.toFixed(maximumFractionDigits)} ${currency}`
  }
}

function DetailCard({
  label,
  value,
  mono = false,
  muted = false,
  containerStyle,
  labelStyle,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  muted?: boolean
  containerStyle?: CSSProperties
  labelStyle?: CSSProperties
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2" style={containerStyle}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary/75" style={labelStyle}>
        {label}
      </p>
      <div className={cn("mt-1 text-sm", mono && "font-mono text-xs", muted && "text-muted-foreground")}>
        {value}
      </div>
    </div>
  )
}

export function CompaniesDrawer({
  open,
  onOpenChange,
  company,
  events,
  side = "right",
  size = "30%",
}: CompaniesDrawerProps) {
  const { dictionary, locale } = useDictionary()
  const resolvedSize = normalizeSize(size)
  const eventTypeLabels = dictionary.companies.eventTypes
  const isOpen = open && Boolean(company)
  const headerBackgroundColor = company?.color ?? "#e2e8f0"
  const headerRgb = hexToRgb(headerBackgroundColor)
  const headerTextColor = getContrastTextColor(headerBackgroundColor)
  const useLightHeaderText = headerTextColor === "#f8fafc"
  const headerSeparatorColor = useLightHeaderText
    ? "rgba(2, 6, 23, 0.28)"
    : "rgba(15, 23, 42, 0.22)"
  const sortedEvents = useMemo(
    () => [...events].sort((left, right) => new Date(right.effectiveDate).getTime() - new Date(left.effectiveDate).getTime()),
    [events]
  )
  const accentSoftBackground = headerRgb
    ? `rgba(${headerRgb.red}, ${headerRgb.green}, ${headerRgb.blue}, 0.10)`
    : "rgba(15, 118, 110, 0.10)"
  const accentMediumBackground = headerRgb
    ? `rgba(${headerRgb.red}, ${headerRgb.green}, ${headerRgb.blue}, 0.18)`
    : "rgba(15, 118, 110, 0.18)"
  const accentBorderColor = headerRgb
    ? `rgba(${headerRgb.red}, ${headerRgb.green}, ${headerRgb.blue}, 0.35)`
    : "rgba(15, 118, 110, 0.35)"

  const drawerStyle: CSSProperties = {
    "--companies-drawer-size": resolvedSize,
  } as CSSProperties

  const detailItems: DrawerDetailItem[] = company
    ? [
      { label: dictionary.personalPath.table.columns.displayName, value: company.displayName },
      { label: dictionary.personalPath.table.columns.roleDisplayName, value: company.roleDisplayName },
      {
        label: dictionary.personalPath.table.columns.monthlyAverageSalary,
        value: company.monthlyAverageSalary !== null
          ? formatAmount(locale, company.currency, company.monthlyAverageSalary, 2)
          : dictionary.personalPath.table.notAvailable,
        muted: company.monthlyAverageSalary === null,
      },
      {
        label: dictionary.personalPath.table.columns.annualSalary,
        value: company.annualSalary !== null
          ? formatAmount(locale, company.currency, company.annualSalary, 0)
          : dictionary.personalPath.table.notAvailable,
        muted: company.annualSalary === null,
      },
    ]
    : []

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[60]" />
        <DialogContent
          className={cn(
            "z-[70] flex w-full max-w-none flex-col gap-0 overflow-hidden border-0 bg-card p-0 ring-0 outline-none",
            "inset-x-0 bottom-0 top-auto h-[88vh] translate-x-0 translate-y-0 rounded-b-none",
            "md:h-screen md:w-[clamp(320px,var(--companies-drawer-size),95vw)] md:max-w-none",
            side === "left"
              ? "md:inset-y-0 md:bottom-0 md:left-0 md:right-auto md:top-0 md:rounded-l-none md:rounded-r-xl"
              : "md:inset-y-0 md:bottom-0 md:left-auto md:right-0 md:top-0 md:rounded-l-xl md:rounded-r-none"
          )}
          style={drawerStyle}
        >
          <header
            className="border-b px-4 py-3"
            style={{
              backgroundColor: headerBackgroundColor,
              borderColor: headerSeparatorColor,
              color: headerTextColor,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="truncate text-base" style={{ color: headerTextColor }}>
                  {company?.displayName ?? dictionary.personalPath.drawer.detailsTitle}
                </DialogTitle>
                <p className="truncate text-sm" style={{ color: headerTextColor, opacity: 0.92 }}>
                  {company?.roleDisplayName}
                </p>
                {company ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-transparent"
                      style={{
                        color: headerTextColor,
                        backgroundColor: useLightHeaderText
                          ? "rgba(248, 250, 252, 0.18)"
                          : "rgba(15, 23, 42, 0.10)",
                        borderColor: useLightHeaderText
                          ? "rgba(248, 250, 252, 0.35)"
                          : "rgba(15, 23, 42, 0.22)",
                      }}
                    >
                      {company.currency}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-transparent"
                      style={{
                        color: headerTextColor,
                        backgroundColor: useLightHeaderText
                          ? "rgba(248, 250, 252, 0.18)"
                          : "rgba(15, 23, 42, 0.10)",
                        borderColor: useLightHeaderText
                          ? "rgba(248, 250, 252, 0.35)"
                          : "rgba(15, 23, 42, 0.22)",
                      }}
                    >
                      {company.compensationType === "hourly"
                        ? dictionary.companies.options.compensationHourly
                        : dictionary.companies.options.compensationMonthly}
                    </Badge>
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onOpenChange(false)}
                  aria-label={dictionary.personalPath.drawer.close}
                  className={cn(useLightHeaderText ? "hover:bg-white/15" : "hover:bg-black/10")}
                  style={{ color: headerTextColor }}
                >
                  <XIcon className="size-4" />
                </Button>
                {company ? (
                  <div
                    className="rounded-md border px-2 py-1 text-right"
                    style={{
                      color: headerTextColor,
                      backgroundColor: useLightHeaderText
                        ? "rgba(248, 250, 252, 0.18)"
                        : "rgba(15, 23, 42, 0.10)",
                      borderColor: useLightHeaderText
                        ? "rgba(248, 250, 252, 0.35)"
                        : "rgba(15, 23, 42, 0.22)",
                    }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em]">
                      {dictionary.personalPath.table.columns.score}
                    </p>
                    <p className="text-sm font-semibold leading-none">{company.score}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-background p-4">
            <section className="space-y-2">
              <h3
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: headerBackgroundColor }}
              >
                {dictionary.personalPath.drawer.detailsTitle}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {detailItems.map((item) => (
                  <DetailCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    mono={item.mono}
                    muted={item.muted}
                    containerStyle={{
                      borderColor: accentBorderColor,
                    }}
                    labelStyle={{ color: headerBackgroundColor }}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-2 pb-2">
              <h3
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: headerBackgroundColor }}
              >
                {dictionary.personalPath.drawer.eventsTitle}
              </h3>
              {sortedEvents.length === 0 ? (
                <div
                  className="rounded-lg border border-dashed px-3 py-4"
                  style={{
                    borderColor: accentBorderColor,
                    backgroundColor: accentSoftBackground,
                  }}
                >
                  <p className="text-sm text-muted-foreground">{dictionary.personalPath.drawer.noEvents}</p>
                </div>
              ) : (
                <div
                  className="overflow-hidden rounded-lg border bg-background"
                  style={{ borderColor: accentBorderColor }}
                >
                  <table className="w-full text-left text-sm">
                    <thead
                      className="text-xs uppercase tracking-[0.08em]"
                      style={{
                        backgroundColor: accentMediumBackground,
                        color: headerBackgroundColor,
                      }}
                    >
                      <tr>
                        <th className="px-3 py-2 font-medium">{dictionary.companies.labels.effectiveDate}</th>
                        <th className="px-3 py-2 font-medium">{dictionary.companies.labels.eventType}</th>
                        <th className="px-3 py-2 font-medium">{dictionary.companies.labels.amount}</th>
                        <th className="px-3 py-2 font-medium">{dictionary.companies.labels.notes}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEvents.map((event) => (
                        <tr
                          key={event.id}
                          className="border-t border-border/70 align-top text-sm text-foreground"
                        >
                          <td className="whitespace-nowrap px-3 py-2">
                            {formatDateValue(event.effectiveDate, locale)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            {eventTypeLabels[event.eventType] ?? dictionary.personalPath.table.notAvailable}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            {company
                              ? formatAmount(locale, company.currency, event.amount, 2)
                              : dictionary.personalPath.table.notAvailable}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {event.notes?.trim().length ? event.notes : dictionary.personalPath.table.notAvailable}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
