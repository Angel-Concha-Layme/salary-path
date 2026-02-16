"use client"

import { useMemo, useState } from "react"

import {
  SalaryHistoryChartWrapper,
  type SalaryHistoryChartSeries,
  type SalaryHistoryTooltipPayload,
} from "@/components/charts/salary-history-chart-wrapper"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon } from "lucide-react"

interface ComparisonTwoPeoplePreviewChartProps {
  locale: string
  dateLabel: string
  periodLabel: string
  companyLabel: string
  eventLabel: string
  personOneLabel: string
  personTwoLabel: string
}

type PersonKey = "one" | "two"

interface ComparisonPointMeta {
  person: PersonKey
  company: string
  companyColor: string
  event: "start" | "annual" | "promotion" | "companyChange"
}

const PERSON_COLOR_VARIANTS: Record<PersonKey, readonly string[]> = {
  one: ["#DC2626", "#EF4444", "#F87171", "#FCA5A5"],
  two: ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD"],
} as const

interface ComparisonJourneyEvent {
  time: string
  value: number
  event: ComparisonPointMeta["event"]
}

interface ComparisonJourneyCompany {
  id: string
  company: string
  events: ComparisonJourneyEvent[]
}

interface ComparisonJourneyCompanyWithStyle extends ComparisonJourneyCompany {
  color: string
}

const PERSON_JOURNEYS: Record<PersonKey, ComparisonJourneyCompany[]> = {
  one: [
    {
      id: "northbyte-labs",
      company: "Northbyte Labs",
      events: [
        { time: "2021-06-01", value: 35000, event: "start" },
        { time: "2022-03-01", value: 38000, event: "annual" },
      ],
    },
    {
      id: "terracloud",
      company: "TerraCloud",
      events: [
        { time: "2022-11-01", value: 43000, event: "companyChange" },
        { time: "2023-07-01", value: 47000, event: "promotion" },
      ],
    },
    {
      id: "atlas-commerce",
      company: "Atlas Commerce",
      events: [
        { time: "2024-01-01", value: 52500, event: "companyChange" },
        { time: "2024-10-01", value: 56500, event: "annual" },
      ],
    },
    {
      id: "vertexpay",
      company: "VertexPay",
      events: [
        { time: "2025-05-01", value: 62000, event: "companyChange" },
        { time: "2026-01-01", value: 66000, event: "annual" },
      ],
    },
  ],
  two: [
    {
      id: "deltaworks",
      company: "DeltaWorks",
      events: [
        { time: "2021-07-01", value: 33000, event: "start" },
        { time: "2022-04-01", value: 35500, event: "annual" },
      ],
    },
    {
      id: "pulseai",
      company: "PulseAI",
      events: [
        { time: "2022-12-01", value: 40000, event: "companyChange" },
        { time: "2023-09-01", value: 44500, event: "promotion" },
      ],
    },
    {
      id: "meridian-data",
      company: "Meridian Data",
      events: [
        { time: "2024-03-01", value: 50000, event: "companyChange" },
        { time: "2024-12-01", value: 54500, event: "annual" },
      ],
    },
    {
      id: "nova-ledger",
      company: "Nova Ledger",
      events: [
        { time: "2025-06-01", value: 58500, event: "companyChange" },
        { time: "2026-01-01", value: 61500, event: "annual" },
      ],
    },
  ],
}

function withAlpha(color: string, alpha: number) {
  const normalized = color.replace("#", "").trim()

  if (normalized.length !== 6) {
    return color
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  if (
    Number.isNaN(red) ||
    Number.isNaN(green) ||
    Number.isNaN(blue)
  ) {
    return color
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function buildPersonCompanies(person: PersonKey): ComparisonJourneyCompanyWithStyle[] {
  const palette = PERSON_COLOR_VARIANTS[person]
  const fallbackColor = palette[palette.length - 1]

  return PERSON_JOURNEYS[person].map((company, index) => ({
    ...company,
    color: palette[index] ?? fallbackColor,
  }))
}

function formatDate(dateKey: string, locale: string) {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return dateKey
  }

  const parsed = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed)
}

function getEventLabel(
  locale: string,
  event: ComparisonPointMeta["event"]
) {
  const isSpanish = locale.startsWith("es")

  if (event === "start") {
    return isSpanish ? "Ingreso inicial" : "Initial offer"
  }

  if (event === "annual") {
    return isSpanish ? "Ajuste anual" : "Annual raise"
  }

  if (event === "promotion") {
    return isSpanish ? "Promoción" : "Promotion"
  }

  if (event === "companyChange") {
    return isSpanish ? "Cambio de empresa" : "Company change"
  }

  return isSpanish ? "Promoción" : "Promotion"
}

export function ComparisonTwoPeoplePreviewChart({
  locale,
  dateLabel,
  periodLabel,
  companyLabel,
  eventLabel,
  personOneLabel,
  personTwoLabel,
}: ComparisonTwoPeoplePreviewChartProps) {
  const personCompanies = useMemo(
    () => ({
      one: buildPersonCompanies("one"),
      two: buildPersonCompanies("two"),
    }),
    []
  )

  const [selectedCompanyIds, setSelectedCompanyIds] = useState<{ one: string; two: string }>({
    one: PERSON_JOURNEYS.one[PERSON_JOURNEYS.one.length - 1]?.id ?? "",
    two: PERSON_JOURNEYS.two[PERSON_JOURNEYS.two.length - 1]?.id ?? "",
  })

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    [locale]
  )

  const selectedPersonOneCompany = useMemo(
    () =>
      personCompanies.one.find((company) => company.id === selectedCompanyIds.one) ??
      personCompanies.one[personCompanies.one.length - 1] ??
      personCompanies.one[0],
    [personCompanies.one, selectedCompanyIds.one]
  )

  const selectedPersonTwoCompany = useMemo(
    () =>
      personCompanies.two.find((company) => company.id === selectedCompanyIds.two) ??
      personCompanies.two[personCompanies.two.length - 1] ??
      personCompanies.two[0],
    [personCompanies.two, selectedCompanyIds.two]
  )

  const chartSeries = useMemo<SalaryHistoryChartSeries<ComparisonPointMeta>[]>(
    () => {
      const personLabels: Record<PersonKey, string> = {
        one: personOneLabel,
        two: personTwoLabel,
      }

      const baseSeries: SalaryHistoryChartSeries<ComparisonPointMeta>[] = []
      const companySeries: SalaryHistoryChartSeries<ComparisonPointMeta>[] = []

      ;(["one", "two"] as const).forEach((person) => {
        const companies = personCompanies[person]
        const timelinePoints = companies
          .flatMap((company) =>
            company.events.map((event) => ({
              time: event.time,
              value: event.value,
              meta: {
                person,
                company: company.company,
                companyColor: company.color,
                event: event.event,
              } satisfies ComparisonPointMeta,
            }))
          )
          .sort((left, right) => left.time.localeCompare(right.time))

        const fallbackColor =
          person === "one" ? PERSON_COLOR_VARIANTS.one[0] : PERSON_COLOR_VARIANTS.two[0]

        baseSeries.push({
          id: `person-${person}-base`,
          label: personLabels[person],
          color: withAlpha(companies[0]?.color ?? fallbackColor, 0.35),
          lineType: "steps",
          lineWidth: 2,
          pointMarkersVisible: false,
          showInLegend: false,
          showInTooltip: false,
          points: timelinePoints,
        })

        companies.forEach((company) => {
          companySeries.push({
            id: `person-${person}-${company.id}`,
            label: personLabels[person],
            color: company.color,
            lineType: "steps",
            lineWidth: 3,
            points: company.events.map((event) => ({
              time: event.time,
              value: event.value,
              meta: {
                person,
                company: company.company,
                companyColor: company.color,
                event: event.event,
              } satisfies ComparisonPointMeta,
            })),
          })
        })
      })

      return [...baseSeries, ...companySeries]
    },
    [personCompanies, personOneLabel, personTwoLabel]
  )

  const selectedPersonOneLatestValue =
    selectedPersonOneCompany?.events[selectedPersonOneCompany.events.length - 1]?.value ?? 0
  const selectedPersonTwoLatestValue =
    selectedPersonTwoCompany?.events[selectedPersonTwoCompany.events.length - 1]?.value ?? 0

  function renderTooltip(payload: SalaryHistoryTooltipPayload<ComparisonPointMeta>) {
    return (
      <div className="space-y-2">
        <p className="font-semibold">
          {dateLabel}: {payload.formattedDate}
        </p>
        {payload.items.map((item) => {
          const event = getEventLabel(locale, item.meta.event)

          return (
            <div key={`${payload.dateKey}-${item.seriesId}`} className="space-y-0.5">
              <p className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}: {currencyFormatter.format(item.value)}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {companyLabel}: {item.meta.company}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {eventLabel}: {event}
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border border-border bg-card p-2 text-card-foreground">
      <div className="mb-1 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span className="text-center font-medium uppercase tracking-[0.14em]">{periodLabel}</span>
      </div>

      <div className="relative z-30 mb-2 grid gap-2 md:grid-cols-2 text-[11px]">
        <div className="rounded-lg border border-border bg-background px-2 py-1.5">
          <p className="mb-1 font-semibold text-foreground">{personOneLabel}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-full justify-between px-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: selectedPersonOneCompany?.color ?? PERSON_COLOR_VARIANTS.one[0] }}
                  />
                  <span className="truncate">{selectedPersonOneCompany?.company}</span>
                </span>
                <ChevronDownIcon className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[140] w-56">
              {personCompanies.one.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onSelect={() => setSelectedCompanyIds((current) => ({ ...current, one: company.id }))}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: company.color }}
                    />
                    <span>{company.company}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-lg border border-border bg-background px-2 py-1.5">
          <p className="mb-1 font-semibold text-foreground">{personTwoLabel}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-full justify-between px-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: selectedPersonTwoCompany?.color ?? PERSON_COLOR_VARIANTS.two[0] }}
                  />
                  <span className="truncate">{selectedPersonTwoCompany?.company}</span>
                </span>
                <ChevronDownIcon className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[140] w-56">
              {personCompanies.two.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onSelect={() => setSelectedCompanyIds((current) => ({ ...current, two: company.id }))}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: company.color }}
                    />
                    <span>{company.company}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: selectedPersonOneCompany?.color ?? PERSON_COLOR_VARIANTS.one[0] }}
          />
          {personOneLabel} ({selectedPersonOneCompany?.company}):{" "}
          <strong className="font-semibold text-foreground">
            {currencyFormatter.format(selectedPersonOneLatestValue)}
          </strong>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: selectedPersonTwoCompany?.color ?? PERSON_COLOR_VARIANTS.two[0] }}
          />
          {personTwoLabel} ({selectedPersonTwoCompany?.company}):{" "}
          <strong className="font-semibold text-foreground">
            {currencyFormatter.format(selectedPersonTwoLatestValue)}
          </strong>
        </span>
      </div>

      <SalaryHistoryChartWrapper<ComparisonPointMeta>
        view="comparison"
        series={chartSeries}
        height={154}
        className="!rounded-lg !p-1.5"
        legend={{
          className: "mb-1.5 space-y-1",
          items: [
            { id: "person-one", label: personOneLabel, color: PERSON_COLOR_VARIANTS.one[0] },
            { id: "person-two", label: personTwoLabel, color: PERSON_COLOR_VARIANTS.two[0] },
          ],
        }}
        formatters={{
          date: (dateKey) => formatDate(dateKey, locale),
          value: (value) => currencyFormatter.format(value),
        }}
        tooltip={{ render: renderTooltip }}
      />
    </div>
  )
}
