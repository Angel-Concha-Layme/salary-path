"use client"

import { ChevronDownIcon } from "lucide-react"

import type {
  PersonalPathChartPointMeta,
  PersonalPathRangePreset,
  PersonalPathRateBasis,
} from "@/app/lib/models/personal-path/personal-path-chart.model"
import {
  SalaryHistoryChartWrapper,
  type SalaryHistoryChartSeries,
  type SalaryHistoryTooltipPayload,
} from "@/components/charts/salary-history-chart-wrapper"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  RANGE_PRESETS,
  formatAmount,
  formatDateKey,
  formatSignedAmount,
} from "./personal-path-formatters"

interface CompanyOption {
  id: string
  displayName: string
  color: string
}

interface CompensationChartDictionary {
  compensationTitle: string
  rangeLabel: string
  rateBasisLabel: string
  companiesLabel: string
  ranges: Record<PersonalPathRangePreset, string>
  rateBasis: { monthly: string; hourly: string }
  allCompaniesSelected: string
  noCompanies: string
  selectedCompaniesCount: string
  selectAllCompanies: string
  clearCompanySelection: string
  legendTitle: string
  emptyState: string
  dateLabel: string
  valueLabel: string
  eventTypeLabel: string
  changeLabel: string
}

interface CompensationChartPanelProps {
  series: SalaryHistoryChartSeries<PersonalPathChartPointMeta>[]
  range: PersonalPathRangePreset
  onRangeChange: (range: PersonalPathRangePreset) => void
  rateBasis: PersonalPathRateBasis
  onRateBasisChange: (rateBasis: PersonalPathRateBasis) => void
  selectedCompanyIds: string[]
  sortedCompanies: CompanyOption[]
  selectedCompaniesLabel: string
  allCompaniesSelected: boolean
  selectedCompanyIdSet: Set<string>
  onToggleCompany: (companyId: string) => void
  onSelectAllCompanies: () => void
  onClearCompanySelection: () => void
  showLegend: boolean
  locale: string
  labels: CompensationChartDictionary
  eventTypeLabels: Record<string, string>
}

function renderRateTooltip(
  payload: SalaryHistoryTooltipPayload<PersonalPathChartPointMeta>,
  locale: string,
  labels: CompensationChartDictionary,
  eventTypeLabels: Record<string, string>
) {
  return (
    <div className="space-y-1">
      <p className="font-semibold">
        {labels.dateLabel}: {payload.formattedDate}
      </p>
      {payload.items.map((item) => {
        if (item.meta.type !== "rate") {
          return null
        }

        const amountLabel = formatAmount(
          locale,
          item.meta.currency,
          item.value,
          item.meta.normalizedCompensationType === "hourly" ? 2 : 0
        )
        const increaseLabel = formatSignedAmount(
          locale,
          item.meta.currency,
          item.meta.increase,
          item.meta.normalizedCompensationType === "hourly" ? 2 : 0
        )
        const shouldShowChange = Math.abs(item.meta.increase) > Number.EPSILON

        return (
          <div key={`${payload.dateKey}-${item.seriesId}`} className="space-y-0.5">
            <p className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-medium">{item.label}</span>
            </p>
            <p>
              {labels.valueLabel}: {amountLabel}
            </p>
            <p>
              {labels.eventTypeLabel}:{" "}
              {eventTypeLabels[item.meta.eventType]}
            </p>
            {shouldShowChange ? (
              <p>
                {labels.changeLabel}: {increaseLabel}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function CompensationChartPanel({
  series,
  range,
  onRangeChange,
  rateBasis,
  onRateBasisChange,
  selectedCompanyIds,
  sortedCompanies,
  selectedCompaniesLabel,
  allCompaniesSelected,
  selectedCompanyIdSet,
  onToggleCompany,
  onSelectAllCompanies,
  onClearCompanySelection,
  showLegend,
  locale,
  labels,
  eventTypeLabels,
}: CompensationChartPanelProps) {
  return (
    <article className="min-w-0 rounded-xl border border-border/80 bg-background">
      <header className="space-y-3 border-b border-border/70 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
          {labels.compensationTitle}
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {labels.rangeLabel}
            </p>
            <Select value={range} onValueChange={(value) => onRangeChange(value as PersonalPathRangePreset)}>
              <SelectTrigger className="h-8 w-full border-border/70 bg-background shadow-none [&_svg]:text-primary/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {labels.ranges[preset]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {labels.rateBasisLabel}
            </p>
            <Select value={rateBasis} onValueChange={(value) => onRateBasisChange(value as PersonalPathRateBasis)}>
              <SelectTrigger className="h-8 w-full border-border/70 bg-background shadow-none [&_svg]:text-primary/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{labels.rateBasis.monthly}</SelectItem>
                <SelectItem value="hourly">{labels.rateBasis.hourly}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {labels.companiesLabel}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 w-full justify-between border-border/70 bg-background font-normal shadow-none hover:bg-accent/40"
                >
                  <span className="truncate">{selectedCompaniesLabel}</span>
                  <ChevronDownIcon className="size-4 text-primary/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 border-border/80">
                <DropdownMenuLabel>{labels.companiesLabel}</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    if (allCompaniesSelected) {
                      onClearCompanySelection()
                      return
                    }

                    onSelectAllCompanies()
                  }}
                >
                  {allCompaniesSelected
                    ? labels.clearCompanySelection
                    : labels.selectAllCompanies}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {sortedCompanies.map((company) => (
                  <DropdownMenuCheckboxItem
                    key={company.id}
                    checked={selectedCompanyIdSet.has(company.id)}
                    onCheckedChange={() => onToggleCompany(company.id)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: company.color }} />
                      <span>{company.displayName}</span>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div className="p-4">
        <SalaryHistoryChartWrapper<PersonalPathChartPointMeta>
          view="rate"
          filters={{
            range,
            companyIds: selectedCompanyIds,
          }}
          series={series}
          height={320}
          legend={showLegend
            ? {
              title: labels.legendTitle,
              className: "mb-3 space-y-2 border-b border-border/70 pb-2",
              itemClassName: "border-border/70 bg-transparent",
            }
            : undefined}
          className="rounded-none border-0 bg-transparent p-0 shadow-none"
          chartClassName="min-w-0 w-full max-w-full"
          emptyState={labels.emptyState}
          formatters={{
            date: (dateKey) => formatDateKey(dateKey, locale),
            value: (value, item) => {
              if (item.meta.type !== "rate") {
                return String(value)
              }

              return formatAmount(
                locale,
                item.meta.currency,
                value,
                item.meta.normalizedCompensationType === "hourly" ? 2 : 0
              )
            },
          }}
          tooltip={{
            render: (payload) => renderRateTooltip(payload, locale, labels, eventTypeLabels),
            className:
              "border-border/70 bg-background/95 shadow-lg supports-[backdrop-filter]:backdrop-blur-sm",
          }}
        />
      </div>
    </article>
  )
}
