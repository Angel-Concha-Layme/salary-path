"use client"

import { useMemo, useState } from "react"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  WORK_SCHEDULE_DAY_OF_WEEK_VALUES,
  WORK_SCHEDULE_DEFAULT_END_MINUTE,
  WORK_SCHEDULE_DEFAULT_START_MINUTE,
  durationValueToMinute,
  minuteToDurationValue,
  minuteToTimeValue,
  normalizeWorkSchedule,
  resolveWorkScheduleDayMinutes,
  timeValueToMinute,
  type WorkSchedule,
  type WorkScheduleDay,
} from "@/app/lib/models/work-schedule/work-schedule.model"
import { ArrowRightIcon, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { TimeInput } from "@/components/ui/time-input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface WorkScheduleEditorHelpText {
  weeklySchedule?: string
  quickEdit?: string
  dayStatus?: string
  from?: string
  to?: string
  breakDuration?: string
}

interface WorkScheduleEditorProps {
  value: WorkSchedule
  onChange: (value: WorkSchedule) => void
  disabled?: boolean
  showDescription?: boolean
  showBreakMinute?: boolean
  className?: string
  helpText?: WorkScheduleEditorHelpText
}

function getDayLabel(dayOfWeek: number, locale: string): string {
  const referenceMonday = new Date(Date.UTC(2024, 0, 1))
  const date = new Date(referenceMonday.getTime() + (dayOfWeek - 1) * 24 * 60 * 60 * 1000)

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  }).format(date)
}

function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(2)
}

function mapScheduleByDay(schedule: WorkSchedule): Map<number, WorkScheduleDay> {
  return new Map(schedule.map((day) => [day.dayOfWeek, day]))
}

function resolveQuickEditRange(schedule: WorkSchedule): {
  startMinute: number
  endMinute: number
  breakMinute: number
} {
  for (const day of schedule) {
    if (
      day.isWorkingDay &&
      day.startMinute !== null &&
      day.endMinute !== null &&
      day.endMinute > day.startMinute
    ) {
      return {
        startMinute: day.startMinute,
        endMinute: day.endMinute,
        breakMinute: day.breakMinute ?? 0,
      }
    }
  }

  return {
    startMinute: WORK_SCHEDULE_DEFAULT_START_MINUTE,
    endMinute: WORK_SCHEDULE_DEFAULT_END_MINUTE,
    breakMinute: 0,
  }
}

function resolveWorkSpanMinutes(day: WorkScheduleDay): number {
  if (!day.isWorkingDay || day.startMinute === null || day.endMinute === null) {
    return 0
  }

  return Math.max(0, day.endMinute - day.startMinute)
}

export function WorkScheduleEditor({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  showBreakMinute = true,
  className,
  helpText,
}: WorkScheduleEditorProps) {
  const { dictionary, locale } = useDictionary()
  const normalizedSchedule = normalizeWorkSchedule(value)
  const scheduleByDay = useMemo(() => mapScheduleByDay(normalizedSchedule), [normalizedSchedule])
  const quickEditSeed = useMemo(
    () => resolveQuickEditRange(normalizedSchedule),
    [normalizedSchedule]
  )
  const [quickEditEnabled, setQuickEditEnabled] = useState(false)
  const [quickEditStartMinute, setQuickEditStartMinute] = useState(quickEditSeed.startMinute)
  const [quickEditEndMinute, setQuickEditEndMinute] = useState(quickEditSeed.endMinute)
  const [quickEditBreakMinute, setQuickEditBreakMinute] = useState(quickEditSeed.breakMinute)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const quickEditRangeInvalid = quickEditEndMinute <= quickEditStartMinute
  const quickEditBreakInvalid =
    showBreakMinute &&
    !quickEditRangeInvalid &&
    quickEditBreakMinute >= quickEditEndMinute - quickEditStartMinute

  function updateDay(nextDay: WorkScheduleDay) {
    const next = WORK_SCHEDULE_DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
      if (dayOfWeek === nextDay.dayOfWeek) {
        return nextDay
      }

      return scheduleByDay.get(dayOfWeek) ?? {
        dayOfWeek,
        isWorkingDay: false,
        startMinute: null,
        endMinute: null,
        breakMinute: null,
      }
    })

    onChange(normalizeWorkSchedule(next))
  }

  function applyQuickEditToWorkingDays(
    startMinute: number,
    endMinute: number,
    breakMinute: number
  ): boolean {
    if (endMinute <= startMinute) {
      return false
    }

    if (showBreakMinute && breakMinute >= endMinute - startMinute) {
      return false
    }

    const next = WORK_SCHEDULE_DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
      const current = scheduleByDay.get(dayOfWeek) ?? {
        dayOfWeek,
        isWorkingDay: false,
        startMinute: null,
        endMinute: null,
        breakMinute: null,
      }

      if (!current.isWorkingDay) {
        return current
      }

      return {
        ...current,
        startMinute,
        endMinute,
        breakMinute: showBreakMinute ? breakMinute : current.breakMinute ?? 0,
      }
    })

    onChange(normalizeWorkSchedule(next))
    return true
  }

  function maybeApplyQuickEdit(startMinute: number, endMinute: number, breakMinute: number) {
    if (endMinute <= startMinute) {
      setValidationMessage(dictionary.profile.workSettings.hints.quickEditInvalid)
      return
    }

    if (showBreakMinute && breakMinute >= endMinute - startMinute) {
      setValidationMessage(dictionary.profile.workSettings.hints.breakInvalid)
      return
    }

    const applied = applyQuickEditToWorkingDays(startMinute, endMinute, breakMinute)

    if (applied) {
      setValidationMessage(null)
    }
  }

  function handleWorkingDayToggle(day: WorkScheduleDay, checked: boolean) {
    if (!checked) {
      updateDay({
        ...day,
        isWorkingDay: false,
        startMinute: null,
        endMinute: null,
        breakMinute: null,
      })
      setValidationMessage(null)
      return
    }

    const safeQuickEditEndMinute = quickEditRangeInvalid
      ? Math.min(quickEditStartMinute + 60, 23 * 60 + 59)
      : quickEditEndMinute
    const quickEditSpan = safeQuickEditEndMinute - quickEditStartMinute
    const safeQuickEditBreakMinute =
      quickEditSpan > 0 && quickEditBreakMinute < quickEditSpan
        ? quickEditBreakMinute
        : 0

    updateDay({
      ...day,
      isWorkingDay: true,
      startMinute: quickEditEnabled
        ? quickEditStartMinute
        : day.startMinute ?? WORK_SCHEDULE_DEFAULT_START_MINUTE,
      endMinute: quickEditEnabled
        ? safeQuickEditEndMinute
        : day.endMinute ?? WORK_SCHEDULE_DEFAULT_END_MINUTE,
      breakMinute: quickEditEnabled
        ? showBreakMinute
          ? safeQuickEditBreakMinute
          : day.breakMinute ?? 0
        : day.breakMinute ?? 0,
    })
    setValidationMessage(null)
  }

  function handleTimeChange(day: WorkScheduleDay, key: "startMinute" | "endMinute", value: string) {
    const nextMinute = timeValueToMinute(value)

    if (nextMinute === null) {
      return
    }

    const candidate: WorkScheduleDay = {
      ...day,
      [key]: nextMinute,
    }

    if (
      candidate.isWorkingDay &&
      candidate.startMinute !== null &&
      candidate.endMinute !== null
    ) {
      if (candidate.endMinute <= candidate.startMinute) {
        setValidationMessage(dictionary.profile.workSettings.hints.quickEditInvalid)
        return
      }

      const breakMinute = candidate.breakMinute ?? 0
      const workSpanMinutes = candidate.endMinute - candidate.startMinute

      if (breakMinute >= workSpanMinutes) {
        setValidationMessage(dictionary.profile.workSettings.hints.breakInvalid)
        return
      }
    }

    updateDay(candidate)
    setValidationMessage(null)
  }

  function handleBreakChange(day: WorkScheduleDay, value: string) {
    const nextMinute = durationValueToMinute(value)

    if (nextMinute === null) {
      return
    }

    const workSpanMinutes = resolveWorkSpanMinutes(day)

    if (workSpanMinutes === 0 || nextMinute >= workSpanMinutes) {
      setValidationMessage(dictionary.profile.workSettings.hints.breakInvalid)
      return
    }

    updateDay({
      ...day,
      breakMinute: nextMinute,
    })
    setValidationMessage(null)
  }

  return (
    <TooltipProvider delayDuration={150}>
      <section className={cn("space-y-3", className)}>
        {showDescription ? (
          <Field>
            <FieldDescription>{dictionary.profile.workSettings.description}</FieldDescription>
          </Field>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <FieldLabel>{dictionary.profile.workSettings.weeklyScheduleLabel}</FieldLabel>
            {helpText?.weeklySchedule ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="h-5 w-5 rounded-full text-muted-foreground"
                    aria-label={helpText.weeklySchedule}
                  >
                    <InfoIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{helpText.weeklySchedule}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/70 px-2 py-1">
              <Checkbox
                id="work-schedule-quick-edit"
                checked={quickEditEnabled}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  const enabled = checked === true

                  if (enabled) {
                    const seededStart = quickEditSeed.startMinute
                    const seededEnd = quickEditSeed.endMinute
                    const seededBreak = quickEditSeed.breakMinute

                    setQuickEditStartMinute(seededStart)
                    setQuickEditEndMinute(seededEnd)
                    setQuickEditBreakMinute(seededBreak)
                    maybeApplyQuickEdit(seededStart, seededEnd, seededBreak)
                  } else {
                    setValidationMessage(null)
                  }

                  setQuickEditEnabled(enabled)
                }}
              />
              <label htmlFor="work-schedule-quick-edit" className="text-xs font-medium text-muted-foreground">
                {dictionary.profile.workSettings.actions.quickEdit}
              </label>
              {(helpText?.quickEdit ?? dictionary.profile.workSettings.hints.quickEdit) ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="h-5 w-5 rounded-full text-muted-foreground"
                      aria-label={helpText?.quickEdit ?? dictionary.profile.workSettings.hints.quickEdit}
                    >
                      <InfoIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {helpText?.quickEdit ?? dictionary.profile.workSettings.hints.quickEdit}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>

            {quickEditEnabled ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {dictionary.profile.workSettings.labels.from}
                  </span>
                  <TimeInput
                    className="w-full sm:w-[132px]"
                    value={minuteToTimeValue(quickEditStartMinute)}
                    ariaInvalid={quickEditRangeInvalid}
                    disabled={disabled}
                    onChange={(nextValue) => {
                      const nextMinute = timeValueToMinute(nextValue)
                      if (nextMinute === null) {
                        return
                      }

                      setQuickEditStartMinute(nextMinute)
                      maybeApplyQuickEdit(nextMinute, quickEditEndMinute, quickEditBreakMinute)
                    }}
                  />
                </div>

                <ArrowRightIcon className="hidden size-4 text-muted-foreground sm:block" />

                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {dictionary.profile.workSettings.labels.to}
                  </span>
                  <TimeInput
                    className="w-full sm:w-[132px]"
                    value={minuteToTimeValue(quickEditEndMinute)}
                    ariaInvalid={quickEditRangeInvalid || quickEditBreakInvalid}
                    disabled={disabled}
                    onChange={(nextValue) => {
                      const nextMinute = timeValueToMinute(nextValue)
                      if (nextMinute === null) {
                        return
                      }

                      setQuickEditEndMinute(nextMinute)
                      maybeApplyQuickEdit(quickEditStartMinute, nextMinute, quickEditBreakMinute)
                    }}
                  />
                </div>

                {showBreakMinute ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {dictionary.profile.workSettings.labels.breakDuration}
                    </span>
                    {helpText?.breakDuration ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="h-5 w-5 rounded-full text-muted-foreground"
                            aria-label={helpText.breakDuration}
                          >
                            <InfoIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{helpText.breakDuration}</TooltipContent>
                      </Tooltip>
                    ) : null}
                    <TimeInput
                      className="w-full sm:w-[118px]"
                      value={minuteToDurationValue(quickEditBreakMinute)}
                      ariaInvalid={quickEditBreakInvalid}
                      disabled={disabled}
                      onChange={(nextValue) => {
                        const nextMinute = durationValueToMinute(nextValue)
                        if (nextMinute === null) {
                          return
                        }

                        setQuickEditBreakMinute(nextMinute)
                        maybeApplyQuickEdit(quickEditStartMinute, quickEditEndMinute, nextMinute)
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {quickEditEnabled && quickEditRangeInvalid ? (
          <p className="text-xs text-destructive">
            {dictionary.profile.workSettings.hints.quickEditInvalid}
          </p>
        ) : null}

        {quickEditEnabled && quickEditBreakInvalid ? (
          <p className="text-xs text-destructive">
            {dictionary.profile.workSettings.hints.breakInvalid}
          </p>
        ) : null}

        {validationMessage && !(quickEditEnabled && (quickEditRangeInvalid || quickEditBreakInvalid)) ? (
          <p className="text-xs text-destructive">{validationMessage}</p>
        ) : null}

        <div className="space-y-2 md:hidden">
          {WORK_SCHEDULE_DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
            const day = scheduleByDay.get(dayOfWeek) ?? {
              dayOfWeek,
              isWorkingDay: false,
              startMinute: null,
              endMinute: null,
              breakMinute: null,
            }
            const totalMinutes = resolveWorkScheduleDayMinutes(day)
            const dayCheckboxId = `work-schedule-day-mobile-${dayOfWeek}`

            return (
              <div key={dayOfWeek} className="space-y-3 rounded-lg border border-border/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium capitalize">{getDayLabel(dayOfWeek, locale)}</p>

                  <div className="inline-flex items-center gap-1.5">
                    <label htmlFor={dayCheckboxId} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        id={dayCheckboxId}
                        checked={day.isWorkingDay}
                        onCheckedChange={(checked) => handleWorkingDayToggle(day, checked === true)}
                        disabled={disabled}
                        aria-label={getDayLabel(dayOfWeek, locale)}
                      />
                      {day.isWorkingDay
                        ? dictionary.profile.workSettings.workingDay
                        : dictionary.profile.workSettings.nonWorkingDay}
                    </label>
                    {helpText?.dayStatus ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="h-5 w-5 rounded-full text-muted-foreground"
                            aria-label={helpText.dayStatus}
                          >
                            <InfoIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{helpText.dayStatus}</TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {dictionary.profile.workSettings.labels.from}
                      </span>
                      {helpText?.from ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="h-5 w-5 rounded-full text-muted-foreground"
                              aria-label={helpText.from}
                            >
                              <InfoIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{helpText.from}</TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                    <TimeInput
                      value={minuteToTimeValue(day.startMinute)}
                      disabled={disabled || !day.isWorkingDay || quickEditEnabled}
                      onChange={(nextValue) => handleTimeChange(day, "startMinute", nextValue)}
                    />
                  </div>

                  <div className="grid gap-1">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {dictionary.profile.workSettings.labels.to}
                      </span>
                      {helpText?.to ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="h-5 w-5 rounded-full text-muted-foreground"
                              aria-label={helpText.to}
                            >
                              <InfoIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{helpText.to}</TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                    <TimeInput
                      value={minuteToTimeValue(day.endMinute)}
                      disabled={disabled || !day.isWorkingDay || quickEditEnabled}
                      onChange={(nextValue) => handleTimeChange(day, "endMinute", nextValue)}
                    />
                  </div>

                  {showBreakMinute ? (
                    <div className="grid gap-1">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {dictionary.profile.workSettings.labels.breakDuration}
                        </span>
                        {helpText?.breakDuration ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="h-5 w-5 rounded-full text-muted-foreground"
                                aria-label={helpText.breakDuration}
                              >
                                <InfoIcon className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">{helpText.breakDuration}</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                      <TimeInput
                        value={minuteToDurationValue(day.breakMinute)}
                        disabled={disabled || !day.isWorkingDay || quickEditEnabled}
                        onChange={(nextValue) => handleBreakChange(day, nextValue)}
                      />
                    </div>
                  ) : null}
                </div>

                <p className="text-right text-xs tabular-nums text-muted-foreground">
                  {day.isWorkingDay
                    ? `${formatHours(totalMinutes)} ${dictionary.profile.workSettings.metrics.dayShort}`
                    : dictionary.profile.notAvailable}
                </p>
              </div>
            )
          })}
        </div>

        <div className="hidden space-y-2 overflow-x-auto md:block">
          {WORK_SCHEDULE_DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
            const day = scheduleByDay.get(dayOfWeek) ?? {
              dayOfWeek,
              isWorkingDay: false,
              startMinute: null,
              endMinute: null,
              breakMinute: null,
            }
            const totalMinutes = resolveWorkScheduleDayMinutes(day)
            const dayCheckboxId = `work-schedule-day-desktop-${dayOfWeek}`
            const rowLayoutClass = showBreakMinute
              ? "grid-cols-[minmax(130px,1fr)_minmax(150px,160px)_minmax(180px,190px)_auto_minmax(180px,190px)_minmax(190px,210px)_minmax(90px,90px)] min-w-[1120px]"
              : "grid-cols-[minmax(130px,1fr)_minmax(150px,160px)_minmax(180px,190px)_auto_minmax(180px,190px)_minmax(90px,90px)] min-w-[940px]"

            return (
              <div
                key={dayOfWeek}
                className={cn(
                  "grid items-center gap-2 rounded-lg border border-border/70 p-2",
                  rowLayoutClass
                )}
              >
                <p className="min-w-[120px] pl-1.5 text-sm font-medium capitalize">
                  {getDayLabel(dayOfWeek, locale)}
                </p>

                <div className="inline-flex items-center gap-1.5">
                  <label htmlFor={dayCheckboxId} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      id={dayCheckboxId}
                      checked={day.isWorkingDay}
                      onCheckedChange={(checked) => handleWorkingDayToggle(day, checked === true)}
                      disabled={disabled}
                      aria-label={getDayLabel(dayOfWeek, locale)}
                    />
                    {day.isWorkingDay
                      ? dictionary.profile.workSettings.workingDay
                      : dictionary.profile.workSettings.nonWorkingDay}
                  </label>
                  {helpText?.dayStatus ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="h-5 w-5 rounded-full text-muted-foreground"
                          aria-label={helpText.dayStatus}
                        >
                          <InfoIcon className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{helpText.dayStatus}</TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>

                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                  <div className="inline-flex items-center gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {dictionary.profile.workSettings.labels.from}
                    </span>
                    {helpText?.from ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="h-5 w-5 rounded-full text-muted-foreground"
                            aria-label={helpText.from}
                          >
                            <InfoIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{helpText.from}</TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                  <TimeInput
                    value={minuteToTimeValue(day.startMinute)}
                    disabled={disabled || !day.isWorkingDay || quickEditEnabled}
                    onChange={(nextValue) => handleTimeChange(day, "startMinute", nextValue)}
                  />
                </div>

                <ArrowRightIcon className="mx-auto size-4 text-muted-foreground" />

                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                  <div className="inline-flex items-center gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {dictionary.profile.workSettings.labels.to}
                    </span>
                    {helpText?.to ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="h-5 w-5 rounded-full text-muted-foreground"
                            aria-label={helpText.to}
                          >
                            <InfoIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{helpText.to}</TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                  <TimeInput
                    value={minuteToTimeValue(day.endMinute)}
                    disabled={disabled || !day.isWorkingDay || quickEditEnabled}
                    onChange={(nextValue) => handleTimeChange(day, "endMinute", nextValue)}
                  />
                </div>

                {showBreakMinute ? (
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {dictionary.profile.workSettings.labels.breakDuration}
                      </span>
                      {helpText?.breakDuration ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="h-5 w-5 rounded-full text-muted-foreground"
                              aria-label={helpText.breakDuration}
                            >
                              <InfoIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{helpText.breakDuration}</TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                    <TimeInput
                      value={minuteToDurationValue(day.breakMinute)}
                      disabled={disabled || !day.isWorkingDay || quickEditEnabled}
                      onChange={(nextValue) => handleBreakChange(day, nextValue)}
                    />
                  </div>
                ) : null}

                <p className="w-[90px] text-right text-xs tabular-nums text-muted-foreground">
                  {day.isWorkingDay
                    ? `${formatHours(totalMinutes)} ${dictionary.profile.workSettings.metrics.dayShort}`
                    : dictionary.profile.notAvailable}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </TooltipProvider>
  )
}
