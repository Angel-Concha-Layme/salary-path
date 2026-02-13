"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ColorType,
  createChart,
  CrosshairMode,
  LineSeries,
  LineType,
  type LineData,
  type MouseEventParams,
  type Time,
} from "lightweight-charts"

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

interface SalaryEventMetadata {
  type: SalaryEventType
  increase: number
  company: CompanyKey
  salary: number
}

interface ChartPointState {
  visible: boolean
  x: number
  y: number
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

const SALARY_DATA: LineData<Time>[] = SALARY_EVENTS.map((event) => ({
  time: event.time,
  value: event.value,
}))

const COMPANY_SEGMENT_DATA = COMPANY_ORDER.reduce<Record<CompanyKey, LineData<Time>[]>>(
  (acc, company) => {
    acc[company] = SALARY_EVENTS
      .filter((event) => event.company === company)
      .map((event) => ({
        time: event.time,
        value: event.value,
      }))
    return acc
  },
  {
    northbyte: [],
    terracloud: [],
    pulseai: [],
    atlas: [],
  }
)

const EVENT_METADATA_BY_TIME = new Map<string, SalaryEventMetadata>(
  SALARY_EVENTS.map((event, index) => {
    const previousValue = SALARY_EVENTS[index - 1]?.value ?? event.value
    return [
      event.time,
      {
        type: event.type,
        increase: event.value - previousValue,
        company: event.company,
        salary: event.value,
      },
    ]
  })
)

function toDateKey(time: Time | undefined): string {
  if (!time) {
    return ""
  }

  if (typeof time === "string") {
    return time
  }

  if (typeof time === "number") {
    return new Date(time * 1000).toISOString().slice(0, 10)
  }

  const month = time.month.toString().padStart(2, "0")
  const day = time.day.toString().padStart(2, "0")
  return `${time.year}-${month}-${day}`
}

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
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

const LAST_EVENT = SALARY_EVENTS[SALARY_EVENTS.length - 1]
const LAST_METADATA = EVENT_METADATA_BY_TIME.get(LAST_EVENT.time)

export function SalaryProgressionPreviewChart({
  locale,
  salaryLabel,
  companyLabel,
  eventTypeLabel,
  increaseLabel,
  periodLabel,
  dateLabel,
}: SalaryProgressionPreviewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const [point, setPoint] = useState<ChartPointState>({
    visible: false,
    x: 12,
    y: 12,
    date: LAST_EVENT.time,
    salary: LAST_EVENT.value,
    company: LAST_METADATA?.company ?? "atlas",
    eventType: LAST_METADATA?.type ?? "annual",
    increase: LAST_METADATA?.increase ?? 0,
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

  useEffect(() => {
    const container = chartContainerRef.current

    if (!container) {
      return
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "transparent",
        },
        textColor: "#334155",
        fontFamily: "var(--font-geist-sans), sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: {
          color: "rgba(148, 163, 184, 0.24)",
        },
        horzLines: {
          color: "rgba(148, 163, 184, 0.2)",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.28)",
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.28)",
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: "rgba(51, 65, 85, 0.35)",
          width: 1,
          labelVisible: false,
        },
        horzLine: {
          color: "rgba(51, 65, 85, 0.35)",
          width: 1,
          labelVisible: false,
        },
      },
      handleScroll: false,
      handleScale: false,
    })

    const baseSeries = chart.addSeries(LineSeries, {
      color: "rgba(71, 85, 105, 0.45)",
      lineWidth: 1,
      lineType: LineType.WithSteps,
      priceLineVisible: false,
      pointMarkersVisible: false,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
    })
    baseSeries.setData(SALARY_DATA)

    COMPANY_ORDER.forEach((company) => {
      const companyColor = COMPANY_STYLES[company].color
      const companySeries = chart.addSeries(LineSeries, {
        color: companyColor,
        lineWidth: 3,
        lineType: LineType.WithSteps,
        priceLineVisible: false,
        crosshairMarkerBackgroundColor: companyColor,
        crosshairMarkerBorderColor: companyColor,
        pointMarkersVisible: true,
        pointMarkersRadius: 3,
        lastValueVisible: false,
      })
      companySeries.setData(COMPANY_SEGMENT_DATA[company])
    })

    chart.timeScale().fitContent()

    const handleCrosshairMove = (event: MouseEventParams<Time>) => {
      const dateKey = toDateKey(event.time)
      const metadata = EVENT_METADATA_BY_TIME.get(dateKey)

      if (
        !event.point ||
        !dateKey ||
        !metadata ||
        event.point.x < 0 ||
        event.point.y < 0 ||
        event.point.x > container.clientWidth ||
        event.point.y > container.clientHeight
      ) {
        setPoint((current) => ({ ...current, visible: false }))
        return
      }

      setPoint({
        visible: true,
        x: clamp(event.point.x + 12, 8, container.clientWidth - 230),
        y: clamp(event.point.y + 12, 8, container.clientHeight - 104),
        date: dateKey,
        salary: metadata.salary,
        company: metadata.company,
        eventType: metadata.type,
        increase: metadata.increase,
      })
    }

    chart.subscribeCrosshairMove(handleCrosshairMove)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]

      if (!entry) {
        return
      }

      chart.applyOptions({
        width: Math.max(100, Math.floor(entry.contentRect.width)),
        height: Math.max(180, Math.floor(entry.contentRect.height)),
      })
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
      chart.unsubscribeCrosshairMove(handleCrosshairMove)
      chart.remove()
    }
  }, [])

  const formattedDate = toDateLabel(point.date, locale)
  const salaryValue = currencyFormatter.format(point.salary)
  const increaseValue = formatIncrease(currencyFormatter, point.increase)
  const eventType = getEventTypeLabel(locale, point.eventType)
  const activeCompany = COMPANY_STYLES[point.company]

  return (
    <div className="relative mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="font-medium uppercase tracking-[0.14em]">{periodLabel}</span>
        <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
          {dateLabel}: {formattedDate}
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

      <div ref={chartContainerRef} className="h-[220px] w-full xl:h-[240px]" />

      {point.visible ? (
        <div
          className="pointer-events-none absolute z-20 min-w-[220px] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-lg backdrop-blur"
          style={{ left: point.x, top: point.y }}
        >
          <p className="font-semibold text-slate-900">
            {dateLabel}: {formattedDate}
          </p>
          <p>{salaryLabel}: {salaryValue}</p>
          <p>{companyLabel}: {activeCompany.label}</p>
          <p>{eventTypeLabel}: {eventType}</p>
          <p>{increaseLabel}: {increaseValue}</p>
        </div>
      ) : null}
    </div>
  )
}
