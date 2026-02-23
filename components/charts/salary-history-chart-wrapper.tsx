"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  ColorType,
  createChart,
  CrosshairMode,
  LineSeries,
  LineType,
  type DeepPartial,
  type LineData,
  type LineWidth,
  type LineSeriesOptions,
  type MouseEventParams,
  type Time,
  type WhitespaceData,
} from "lightweight-charts"

import { cn } from "@/lib/utils"

export interface SalaryHistoryChartSeriesPoint<TMeta = unknown> {
  time: string
  value: number
  meta: TMeta
}

export interface SalaryHistoryChartSeries<TMeta = unknown> {
  id: string
  label: string
  color: string
  lineType: "steps" | "simple"
  lineWidth?: LineWidth
  pointMarkersVisible?: boolean
  showInLegend?: boolean
  showInTooltip?: boolean
  points: SalaryHistoryChartSeriesPoint<TMeta>[]
}

export interface SalaryHistoryChartFilters {
  range?: string
  companyIds?: string[]
}

export interface SalaryHistoryTooltipItem<TMeta = unknown> {
  seriesId: string
  label: string
  color: string
  value: number
  meta: TMeta
}

export interface SalaryHistoryTooltipPayload<TMeta = unknown> {
  dateKey: string
  formattedDate: string
  x: number
  y: number
  items: SalaryHistoryTooltipItem<TMeta>[]
}

interface SalaryHistoryChartWrapperProps<TMeta = unknown> {
  series: SalaryHistoryChartSeries<TMeta>[]
  view: string
  filters?: SalaryHistoryChartFilters
  formatters: {
    value: (value: number, item: SalaryHistoryTooltipItem<TMeta>) => string
    date: (dateKey: string) => string
  }
  legend?: {
    title?: string
    description?: string
    items?: Array<{ id: string; label: string; color: string }>
    className?: string
    itemClassName?: string
  }
  tooltip?: {
    render?: (payload: SalaryHistoryTooltipPayload<TMeta>) => ReactNode
    className?: string
  }
  height?: number
  emptyState?: ReactNode
  className?: string
  chartClassName?: string
  onTooltipChange?: (payload: SalaryHistoryTooltipPayload<TMeta> | null) => void
}

type TooltipState<TMeta = unknown> = SalaryHistoryTooltipPayload<TMeta>

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

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

function getColorWithAlpha(color: string, alpha: number): string {
  const match = color.match(/\d+(\.\d+)?/g)

  if (!match || match.length < 3) {
    return color
  }

  const [red, green, blue] = match
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function isLightweightChartsSafeColor(value: string): boolean {
  const normalized = value.trim().toLowerCase()

  if (normalized.startsWith("#")) {
    return true
  }

  if (normalized.startsWith("rgb(") || normalized.startsWith("rgba(")) {
    return true
  }

  return false
}

function sanitizeChartColor(value: string | null | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback
  }

  return isLightweightChartsSafeColor(value) ? value : fallback
}

function getThemeTokens(container: HTMLElement) {
  const isDark = document.documentElement.classList.contains("dark")
  const fallbackTextColor = isDark ? "rgb(226, 232, 240)" : "rgb(51, 65, 85)"
  const fallbackBorderColor = isDark ? "rgba(148, 163, 184, 0.36)" : "rgba(148, 163, 184, 0.28)"
  const style = getComputedStyle(container)
  const textColor = sanitizeChartColor(style.color, fallbackTextColor)
  const borderColor = sanitizeChartColor(style.borderColor, fallbackBorderColor)

  return {
    textColor,
    borderColor,
    gridVertical: getColorWithAlpha(textColor, 0.14),
    gridHorizontal: getColorWithAlpha(textColor, 0.1),
    crosshair: getColorWithAlpha(textColor, 0.35),
  }
}

function toUtcDateFromDateKey(dateKey: string): Date | null {
  const parsed = new Date(`${dateKey}T00:00:00.000Z`)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function toDateKeyFromUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseDateKeyToTimestamp(dateKey: string): number | null {
  const parsed = toUtcDateFromDateKey(dateKey)

  if (!parsed) {
    return null
  }

  return parsed.getTime()
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function buildDailyTimelineAnchors<TMeta>(
  series: SalaryHistoryChartSeries<TMeta>[]
): string[] {
  const allDates = series
    .flatMap((entry) => entry.points.map((point) => toUtcDateFromDateKey(point.time)))
    .filter((date): date is Date => Boolean(date))

  if (allDates.length < 2) {
    return []
  }

  const minTimestamp = Math.min(...allDates.map((date) => date.getTime()))
  const maxTimestamp = Math.max(...allDates.map((date) => date.getTime()))

  if (!Number.isFinite(minTimestamp) || !Number.isFinite(maxTimestamp) || minTimestamp >= maxTimestamp) {
    return []
  }

  const minDate = new Date(minTimestamp)
  const maxDate = new Date(maxTimestamp)
  const anchors: string[] = []
  let cursor = minDate

  while (cursor.getTime() <= maxDate.getTime()) {
    anchors.push(toDateKeyFromUtcDate(cursor))
    cursor = addUtcDays(cursor, 1)
  }

  return anchors
}

function findPointForDate<TMeta>(
  points: SalaryHistoryChartSeriesPoint<TMeta>[],
  dateKey: string,
  lineType: SalaryHistoryChartSeries<TMeta>["lineType"]
): SalaryHistoryChartSeriesPoint<TMeta> | null {
  if (points.length === 0) {
    return null
  }

  let previous: SalaryHistoryChartSeriesPoint<TMeta> | null = null
  let next: SalaryHistoryChartSeriesPoint<TMeta> | null = null
  let exactMatch: SalaryHistoryChartSeriesPoint<TMeta> | null = null

  for (const point of points) {
    if (point.time === dateKey) {
      exactMatch = point
      break
    }

    if (point.time < dateKey) {
      previous = point
      continue
    }

    next = point
    break
  }

  const hasEndedEmploymentEvent =
    (meta: unknown): boolean =>
      typeof meta === "object" &&
      meta !== null &&
      "eventType" in meta &&
      (meta as { eventType?: unknown }).eventType === "end_of_employment"

  if (exactMatch) {
    return exactMatch
  }

  if (lineType === "steps") {
    if (!previous) {
      return null
    }

    if (!next && hasEndedEmploymentEvent(previous.meta)) {
      return null
    }

    return previous
  }

  if (!previous) {
    return next
  }

  if (!next) {
    if (hasEndedEmploymentEvent(previous.meta)) {
      return null
    }

    return previous
  }

  const targetTimestamp = parseDateKeyToTimestamp(dateKey)
  const previousTimestamp = parseDateKeyToTimestamp(previous.time)
  const nextTimestamp = parseDateKeyToTimestamp(next.time)

  if (
    targetTimestamp === null ||
    previousTimestamp === null ||
    nextTimestamp === null
  ) {
    return previous
  }

  return Math.abs(targetTimestamp - previousTimestamp) <= Math.abs(nextTimestamp - targetTimestamp)
    ? previous
    : next
}

export function SalaryHistoryChartWrapper<TMeta = unknown>({
  series,
  view,
  filters: _filters,
  formatters,
  legend,
  tooltip,
  height = 260,
  emptyState,
  className,
  chartClassName,
  onTooltipChange,
}: SalaryHistoryChartWrapperProps<TMeta>) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const formattersRef = useRef(formatters)
  const onTooltipChangeRef = useRef(onTooltipChange)
  const [tooltipState, setTooltipState] = useState<TooltipState<TMeta> | null>(null)
  void _filters

  const hasRenderableData = useMemo(
    () => series.some((entry) => entry.points.length > 0),
    [series]
  )

  useEffect(() => {
    formattersRef.current = formatters
  }, [formatters])

  useEffect(() => {
    onTooltipChangeRef.current = onTooltipChange
  }, [onTooltipChange])

  useEffect(() => {
    const container = chartContainerRef.current

    if (!container || !hasRenderableData) {
      return
    }

    const widthHost = container.parentElement ?? container
    const resolveChartWidth = () =>
      Math.max(100, Math.floor(widthHost.clientWidth || container.clientWidth))
    const resolveChartHeight = () => Math.max(180, Math.floor(container.clientHeight))

    const themeTokens = getThemeTokens(container)
    const chart = createChart(container, {
      width: resolveChartWidth(),
      height: resolveChartHeight(),
      layout: {
        background: {
          type: ColorType.Solid,
          color: "transparent",
        },
        textColor: themeTokens.textColor,
        fontFamily: "var(--font-geist-sans), sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: {
          color: themeTokens.gridVertical,
        },
        horzLines: {
          color: themeTokens.gridHorizontal,
        },
      },
      rightPriceScale: {
        borderColor: themeTokens.borderColor,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        borderColor: themeTokens.borderColor,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: themeTokens.crosshair,
          width: 1,
          labelVisible: false,
        },
        horzLine: {
          color: themeTokens.crosshair,
          width: 1,
          labelVisible: false,
        },
      },
      handleScroll: true,
      handleScale: true,
    })

    const pointsMapBySeriesId = new Map<
      string,
      Map<string, SalaryHistoryChartSeriesPoint<TMeta>>
    >()
    const pointsListBySeriesId = new Map<string, SalaryHistoryChartSeriesPoint<TMeta>[]>()

    series.forEach((entry) => {
      const lineSeriesOptions: DeepPartial<LineSeriesOptions> = {
        color: entry.color,
        lineWidth: entry.lineWidth ?? 3,
        lineType: entry.lineType === "steps" ? LineType.WithSteps : LineType.Simple,
        priceLineVisible: false,
        crosshairMarkerBackgroundColor: entry.color,
        crosshairMarkerBorderColor: entry.color,
        pointMarkersVisible: entry.pointMarkersVisible ?? true,
        pointMarkersRadius: 3,
        lastValueVisible: false,
      }
      const lineSeries = chart.addSeries(LineSeries, lineSeriesOptions)
      const pointsData: LineData<Time>[] = entry.points.map((point) => ({
        time: point.time,
        value: point.value,
      }))
      const chartData: Array<LineData<Time> | WhitespaceData<Time>> = pointsData

      if (entry.lineType === "steps" && pointsData.length > 0) {
        const firstPointDateKey = toDateKey(pointsData[0]?.time)
        const firstPointDate = firstPointDateKey
          ? toUtcDateFromDateKey(firstPointDateKey)
          : null

        if (firstPointDate) {
          const previousDay = new Date(firstPointDate.getTime() - 24 * 60 * 60 * 1000)
          const previousDayKey = toDateKeyFromUtcDate(previousDay)

          chartData.unshift({ time: previousDayKey })
        }
      }

      lineSeries.setData(chartData)

      pointsMapBySeriesId.set(
        entry.id,
        new Map(entry.points.map((point) => [point.time, point]))
      )
      pointsListBySeriesId.set(entry.id, entry.points)
    })

    const timelineAnchors = buildDailyTimelineAnchors(series)

    if (timelineAnchors.length > 0) {
      const anchorSeries = chart.addSeries(LineSeries, {
        color: "rgba(0, 0, 0, 0)",
        lineWidth: 1,
        lineType: LineType.Simple,
        pointMarkersVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
      })

      anchorSeries.setData(timelineAnchors.map((time) => ({ time })))
    }

    chart.timeScale().fitContent()

    const handleCrosshairMove = (event: MouseEventParams<Time>) => {
      const dateKey = toDateKey(event.time)

      if (
        !event.point ||
        !dateKey ||
        event.point.x < 0 ||
        event.point.y < 0 ||
        event.point.x > container.clientWidth ||
        event.point.y > container.clientHeight
      ) {
        setTooltipState(null)
        onTooltipChangeRef.current?.(null)
        return
      }

      const items: SalaryHistoryTooltipItem<TMeta>[] = series
        .map((entry) => {
          if (entry.showInTooltip === false) {
            return null
          }

          const points = pointsListBySeriesId.get(entry.id) ?? []
          const point =
            pointsMapBySeriesId.get(entry.id)?.get(dateKey) ??
            findPointForDate(points, dateKey, entry.lineType)

          if (!point) {
            return null
          }

          return {
            seriesId: entry.id,
            label: entry.label,
            color: entry.color,
            value: point.value,
            meta: point.meta,
          } satisfies SalaryHistoryTooltipItem<TMeta>
        })
        .filter((item): item is SalaryHistoryTooltipItem<TMeta> => Boolean(item))

      if (items.length === 0) {
        setTooltipState(null)
        onTooltipChangeRef.current?.(null)
        return
      }

      const nextTooltipState = {
        dateKey,
        formattedDate: formattersRef.current.date(dateKey),
        x: clamp(event.point.x + 12, 8, container.clientWidth - 270),
        y: clamp(event.point.y + 12, 8, container.clientHeight - 144),
        items,
      } satisfies TooltipState<TMeta>

      setTooltipState(nextTooltipState)
      onTooltipChangeRef.current?.(nextTooltipState)
    }

    chart.subscribeCrosshairMove(handleCrosshairMove)

    const resizeChart = () => {
      chart.applyOptions({
        width: resolveChartWidth(),
        height: resolveChartHeight(),
      })
      chart.timeScale().fitContent()
    }

    const resizeObserver = new ResizeObserver(() => {
      resizeChart()
    })
    resizeObserver.observe(container)
    if (widthHost !== container) {
      resizeObserver.observe(widthHost)
    }

    const root = document.documentElement
    const themeObserver = new MutationObserver(() => {
      const nextThemeTokens = getThemeTokens(container)
      chart.applyOptions({
        layout: {
          textColor: nextThemeTokens.textColor,
        },
        grid: {
          vertLines: { color: nextThemeTokens.gridVertical },
          horzLines: { color: nextThemeTokens.gridHorizontal },
        },
        rightPriceScale: {
          borderColor: nextThemeTokens.borderColor,
        },
        timeScale: {
          borderColor: nextThemeTokens.borderColor,
        },
        crosshair: {
          vertLine: {
            color: nextThemeTokens.crosshair,
            width: 1,
            labelVisible: false,
          },
          horzLine: {
            color: nextThemeTokens.crosshair,
            width: 1,
            labelVisible: false,
          },
        },
      })
    })
    themeObserver.observe(root, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })

    return () => {
      resizeObserver.disconnect()
      themeObserver.disconnect()
      chart.unsubscribeCrosshairMove(handleCrosshairMove)
      chart.remove()
    }
  }, [hasRenderableData, series, view])

  const legendItems = legend?.items ?? series
    .filter((entry) => entry.showInLegend !== false)
    .map((entry) => ({
    id: entry.id,
    label: entry.label,
    color: entry.color,
  }))

  return (
    <div
      className={cn(
        "relative min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-border/80 bg-background p-3 text-card-foreground",
        className
      )}
    >
      {legend ? (
        <div className={cn("mb-3 space-y-2", legend.className)}>
          {legend.title ? (
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-foreground">
              {legend.title}
            </p>
          ) : null}
          {legend.description ? (
            <p className="text-xs text-muted-foreground">{legend.description}</p>
          ) : null}
          {legendItems.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-[11px] text-foreground/90">
              {legendItems.map((entry) => (
                <span
                  key={entry.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background px-2 py-1",
                    legend.itemClassName
                  )}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasRenderableData ? (
        <div
          ref={chartContainerRef}
          className={cn("min-w-0 w-full max-w-full", chartClassName)}
          style={{ height: `${height}px` }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-lg border border-dashed border-border/70 bg-background p-5 text-sm text-muted-foreground"
          style={{ height: `${height}px` }}
        >
          {emptyState ?? "No data to display yet."}
        </div>
      )}

      {tooltipState ? (
        <div
          className={cn(
            "pointer-events-none absolute z-20 min-w-[220px] rounded-lg border border-border/80 bg-background px-3 py-2 text-xs text-foreground",
            tooltip?.className
          )}
          style={{ left: tooltipState.x, top: tooltipState.y }}
        >
          {tooltip?.render ? (
            tooltip.render(tooltipState)
          ) : (
            <div className="space-y-1">
              <p className="font-semibold">{tooltipState.formattedDate}</p>
              {tooltipState.items.map((item) => (
                <p key={`${item.seriesId}-${tooltipState.dateKey}`} className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}:</span>
                  <span className="font-medium">{formatters.value(item.value, item)}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
