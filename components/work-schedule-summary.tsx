"use client"

import { useMemo } from "react"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  minuteToDurationValue,
  minuteToTimeValue,
  normalizeWorkSchedule,
  type WorkSchedule,
} from "@/app/lib/models/work-schedule/work-schedule.model"
import { cn } from "@/lib/utils"

interface WorkScheduleSummaryProps {
  schedule: WorkSchedule
  showBreakMinute?: boolean
  className?: string
  emptyMessage?: string
}

function getShortDayLabel(dayOfWeek: number, locale: string): string {
  const referenceMonday = new Date(Date.UTC(2024, 0, 1))
  const date = new Date(referenceMonday.getTime() + (dayOfWeek - 1) * 24 * 60 * 60 * 1000)

  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  }).format(date)
}

export function WorkScheduleSummary({
  schedule,
  showBreakMinute = true,
  className,
  emptyMessage,
}: WorkScheduleSummaryProps) {
  const { dictionary, locale } = useDictionary()

  const rows = useMemo(
    () =>
      normalizeWorkSchedule(schedule).filter(
        (day) => day.isWorkingDay && day.startMinute !== null && day.endMinute !== null
      ),
    [schedule]
  )

  if (rows.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {emptyMessage ?? dictionary.profile.notAvailable}
      </p>
    )
  }

  return (
    <ul className={cn("space-y-1.5", className)}>
      {rows.map((day) => (
        <li
          key={day.dayOfWeek}
          className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-xs"
        >
          <span className="min-w-10 font-semibold uppercase text-foreground/90">
            {getShortDayLabel(day.dayOfWeek, locale)}
          </span>
          <span className="tabular-nums text-foreground/90">
            {minuteToTimeValue(day.startMinute)} - {minuteToTimeValue(day.endMinute)}
          </span>
          {showBreakMinute ? (
            <span className="tabular-nums text-muted-foreground">
              {dictionary.profile.workSettings.labels.breakDuration}:{" "}
              {minuteToDurationValue(day.breakMinute ?? 0)}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
