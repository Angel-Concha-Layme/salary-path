"use client"

import { useMemo, useState } from "react"

import { SalaryHistoryChartWrapper } from "@/components/charts/salary-history-chart-wrapper"

interface SalaryProgressionPreviewChartProps {
  locale: string
  salaryLabel: string
  companyLabel: string
  eventTypeLabel: string
  increaseLabel: string
  periodLabel: string
  dateLabel: string
}

type CompanyKey = "northbyte" | "terracloud" | "pulseai" | "atlas"

type SalaryEventType =
  | "start"
  | "annual"
  | "annual-minimal"
  | "market-adjustment"
  | "promotion"
  | "company-change"
  | "company-change-down"

interface SalaryEvent {
  time: string
  value: number
  type: SalaryEventType
  company: CompanyKey
}

interface PreviewPointMeta {
  company: CompanyKey
  eventType: SalaryEventType
  increase: number
  salary: number
}

interface PreviewPointState {
  date: string
  salary: number
  company: CompanyKey
  eventType: SalaryEventType
  increase: number
}

const COMPANY_ORDER: CompanyKey[] = ["northbyte", "terracloud", "pulseai", "atlas"]

const COMPANY_STYLES: Record<CompanyKey, { label: string; color: string }> = {
  northbyte: {
    label: "Northbyte Labs",
    color: "#0f766e",
  },
  terracloud: {
    label: "TerraCloud",
    color: "#b45309",
  },
  pulseai: {
    label: "PulseAI",
    color: "#7c3aed",
  },
  atlas: {
    label: "Atlas Commerce",
    color: "#0369a1",
  },
}

const SALARY_EVENTS: SalaryEvent[] = [
  { time: "2018-03-12", value: 38000, type: "start", company: "northbyte" },
  { time: "2018-12-20", value: 40500, type: "annual", company: "northbyte" },
  { time: "2019-12-18", value: 41000, type: "annual-minimal", company: "northbyte" },
  { time: "2020-09-01", value: 47000, type: "promotion", company: "northbyte" },
  { time: "2021-04-05", value: 52500, type: "company-change", company: "terracloud" },
  { time: "2021-12-20", value: 55200, type: "annual", company: "terracloud" },
  { time: "2022-11-14", value: 53500, type: "company-change-down", company: "pulseai" },
  { time: "2022-12-20", value: 54000, type: "annual-minimal", company: "pulseai" },
  { time: "2023-08-07", value: 62000, type: "promotion", company: "pulseai" },
  { time: "2023-12-18", value: 64800, type: "annual", company: "pulseai" },
  { time: "2024-06-03", value: 70500, type: "company-change", company: "atlas" },
  { time: "2024-12-16", value: 73600, type: "annual", company: "atlas" },
  { time: "2025-07-14", value: 78000, type: "market-adjustment", company: "atlas" },
  { time: "2025-12-15", value: 78600, type: "annual-minimal", company: "atlas" },
  { time: "2026-02-02", value: 84500, type: "promotion", company: "atlas" },
]

const LAST_EVENT = SALARY_EVENTS[SALARY_EVENTS.length - 1]

function toDateLabel(dateKey: string, locale: string) {
  if (!dateKey) {
    return ""
  }

  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function formatIncrease(currencyFormatter: Intl.NumberFormat, value: number) {
  if (value === 0) {
    return currencyFormatter.format(0)
  }

  const sign = value > 0 ? "+" : "-"
  return `${sign}${currencyFormatter.format(Math.abs(value))}`
}

function getEventTypeLabel(locale: string, type: SalaryEventType) {
  const isSpanish = locale.startsWith("es")

  if (isSpanish) {
    if (type === "start") return "Ingreso inicial"
    if (type === "annual") return "Ajuste anual (fin de año)"
    if (type === "annual-minimal") return "Ajuste anual mínimo (bajo rendimiento)"
    if (type === "market-adjustment") return "Ajuste por mercado"
    if (type === "company-change") return "Cambio de empresa"
    if (type === "company-change-down") return "Cambio de empresa (a la baja)"
    return "Promoción"
  }

  if (type === "start") return "Initial offer"
  if (type === "annual") return "Annual raise (year-end)"
  if (type === "annual-minimal") return "Minimal annual raise (low performance)"
  if (type === "market-adjustment") return "Market adjustment"
  if (type === "company-change") return "Company change"
  if (type === "company-change-down") return "Company change (pay cut)"
  return "Promotion"
}

function buildPreviewSeries() {
  const basePoints = SALARY_EVENTS.map((event, index) => {
    const previousValue = SALARY_EVENTS[index - 1]?.value ?? event.value

    return {
      time: event.time,
      value: event.value,
      meta: {
        company: event.company,
        eventType: event.type,
        increase: event.value - previousValue,
        salary: event.value,
      } satisfies PreviewPointMeta,
    }
  })

  return [
    {
      id: "base",
      label: "base",
      color: "rgba(71, 85, 105, 0.45)",
      lineType: "steps" as const,
      lineWidth: 1 as const,
      pointMarkersVisible: false,
      showInLegend: false,
      showInTooltip: false,
      points: basePoints,
    },
    ...COMPANY_ORDER.map((company) => {
      const points = basePoints.filter((point) => point.meta.company === company)

      return {
        id: company,
        label: COMPANY_STYLES[company].label,
        color: COMPANY_STYLES[company].color,
        lineType: "steps" as const,
        lineWidth: 3 as const,
        pointMarkersVisible: true,
        points,
      }
    }),
  ]
}

export function SalaryProgressionPreviewChart({
  locale,
  salaryLabel,
  companyLabel,
  eventTypeLabel,
  increaseLabel,
  periodLabel,
  dateLabel,
}: SalaryProgressionPreviewChartProps) {
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    [locale]
  )

  const initialPoint = useMemo<PreviewPointState>(() => {
    const previous = SALARY_EVENTS[SALARY_EVENTS.length - 2]
    const increase = LAST_EVENT
      ? LAST_EVENT.value - (previous?.value ?? LAST_EVENT.value)
      : 0

    return {
      date: LAST_EVENT?.time ?? "",
      salary: LAST_EVENT?.value ?? 0,
      company: LAST_EVENT?.company ?? "atlas",
      eventType: LAST_EVENT?.type ?? "annual",
      increase,
    }
  }, [])

  const [activePoint, setActivePoint] = useState<PreviewPointState>(initialPoint)

  const salaryValue = currencyFormatter.format(activePoint.salary)
  const increaseValue = formatIncrease(currencyFormatter, activePoint.increase)
  const eventType = getEventTypeLabel(locale, activePoint.eventType)
  const activeCompany = COMPANY_STYLES[activePoint.company]
  const chartSeries = useMemo(() => buildPreviewSeries(), [])

  return (
    <div className="relative mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="font-medium uppercase tracking-[0.14em]">{periodLabel}</span>
        <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
          {dateLabel}: {toDateLabel(activePoint.date, locale)}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1">
          <span className="size-2 rounded-full bg-teal-700" />
          {salaryLabel}: <strong className="font-semibold text-slate-700">{salaryValue}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: activeCompany.color }}
          />
          {companyLabel}: <strong className="font-semibold text-slate-700">{activeCompany.label}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1">
          <span className="size-2 rounded-full bg-sky-700" />
          {increaseLabel}: <strong className="font-semibold text-slate-700">{increaseValue}</strong>
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-[10px] text-slate-600">
        {COMPANY_ORDER.map((company) => (
          <span
            key={company}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: COMPANY_STYLES[company].color }}
            />
            {COMPANY_STYLES[company].label}
          </span>
        ))}
      </div>

      <SalaryHistoryChartWrapper<PreviewPointMeta>
        view="rate"
        series={chartSeries}
        height={230}
        className="!border-slate-200 !bg-transparent !p-0"
        formatters={{
          date: (dateKey) => toDateLabel(dateKey, locale),
          value: (value) => currencyFormatter.format(value),
        }}
        onTooltipChange={(payload) => {
          const item = payload?.items[0]

          if (!item || item.meta.company === undefined) {
            return
          }

          setActivePoint((current) => ({
            date: payload?.dateKey ?? current.date,
            salary: item.value,
            company: item.meta.company,
            eventType: item.meta.eventType,
            increase: item.meta.increase,
          }))
        }}
        tooltip={{
          className: "!border-slate-200 !bg-white/95 !text-slate-700",
          render: (payload) => {
            const item = payload.items[0]

            if (!item) {
              return null
            }

            return (
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">
                  {dateLabel}: {payload.formattedDate}
                </p>
                <p>{salaryLabel}: {currencyFormatter.format(item.value)}</p>
                <p>{companyLabel}: {COMPANY_STYLES[item.meta.company].label}</p>
                <p>{eventTypeLabel}: {getEventTypeLabel(locale, item.meta.eventType)}</p>
                <p>{increaseLabel}: {formatIncrease(currencyFormatter, item.meta.increase)}</p>
              </div>
            )
          },
        }}
      />

      <p className="mt-3 text-xs text-slate-600">
        {eventTypeLabel}: <span className="font-medium text-slate-700">{eventType}</span>
      </p>
    </div>
  )
}
