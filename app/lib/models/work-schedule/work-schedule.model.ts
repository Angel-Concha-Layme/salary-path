import { z } from "zod"

export const WORK_SCHEDULE_DAY_OF_WEEK_VALUES = [1, 2, 3, 4, 5, 6, 7] as const

export type WorkScheduleDayOfWeek = (typeof WORK_SCHEDULE_DAY_OF_WEEK_VALUES)[number]

export interface WorkScheduleDay {
  dayOfWeek: WorkScheduleDayOfWeek
  isWorkingDay: boolean
  startMinute: number | null
  endMinute: number | null
  breakMinute: number | null
}

export type WorkSchedule = WorkScheduleDay[]

export const WORK_SCHEDULE_DEFAULT_START_MINUTE = 9 * 60
export const WORK_SCHEDULE_DEFAULT_END_MINUTE = 17 * 60

const workScheduleDayOfWeekSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
])

const baseDaySchema = z.object({
  dayOfWeek: workScheduleDayOfWeekSchema,
  isWorkingDay: z.boolean(),
  startMinute: z.number().int().min(0).max(1440).nullable(),
  endMinute: z.number().int().min(0).max(1440).nullable(),
  breakMinute: z.number().int().min(0).max(1440).nullable(),
})

export const workScheduleDaySchema = baseDaySchema.superRefine((value, context) => {
  if (!value.isWorkingDay) {
    if (
      value.startMinute !== null ||
      value.endMinute !== null ||
      value.breakMinute !== null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startMinute"],
        message: "Non-working days must not contain time or break values",
      })
    }

    return
  }

  if (value.startMinute === null || value.endMinute === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startMinute"],
      message: "Working days require start and end time",
    })

    return
  }

  if (value.endMinute <= value.startMinute) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endMinute"],
      message: "endMinute must be greater than startMinute",
    })

    return
  }

  if (value.breakMinute === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["breakMinute"],
      message: "Working days require breakMinute",
    })

    return
  }

  const breakMinute = value.breakMinute
  const workSpanMinutes = value.endMinute - value.startMinute

  if (breakMinute >= workSpanMinutes) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["breakMinute"],
      message: "breakMinute must be smaller than worked span",
    })
  }
})

export const workScheduleSchema = z
  .array(workScheduleDaySchema)
  .length(7)
  .superRefine((days, context) => {
    const uniqueDays = new Set(days.map((day) => day.dayOfWeek))

    if (uniqueDays.size !== 7) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Work schedule must include exactly one row for each day of the week",
      })
    }
  })
  .transform(
    (days): WorkSchedule =>
      [...days]
        .map((day) => ({
          dayOfWeek: day.dayOfWeek,
          isWorkingDay: day.isWorkingDay,
          startMinute: day.startMinute,
          endMinute: day.endMinute,
          breakMinute: day.isWorkingDay ? day.breakMinute ?? 0 : null,
        }))
        .sort((left, right) => left.dayOfWeek - right.dayOfWeek)
  )

export function buildDefaultWorkSchedule(): WorkSchedule {
  return WORK_SCHEDULE_DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
    const isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 5

    return {
      dayOfWeek,
      isWorkingDay,
      startMinute: isWorkingDay ? WORK_SCHEDULE_DEFAULT_START_MINUTE : null,
      endMinute: isWorkingDay ? WORK_SCHEDULE_DEFAULT_END_MINUTE : null,
      breakMinute: isWorkingDay ? 0 : null,
    }
  })
}

export function normalizeWorkSchedule(
  value: WorkSchedule | null | undefined,
  fallback = buildDefaultWorkSchedule()
): WorkSchedule {
  if (!value || value.length !== 7) {
    return fallback
  }

  const withHydration = value.map((day) => ({
    ...day,
    startMinute: day.startMinute ?? null,
    endMinute: day.endMinute ?? null,
    breakMinute: day.breakMinute ?? (day.isWorkingDay ? 0 : null),
  }))
  const parsed = workScheduleSchema.safeParse(withHydration)

  if (!parsed.success) {
    return fallback
  }

  return parsed.data
}

export function areWorkSchedulesEqual(
  left: WorkSchedule | null | undefined,
  right: WorkSchedule | null | undefined
): boolean {
  if (!left && !right) {
    return true
  }

  if (!left || !right) {
    return false
  }

  const normalizedLeft = normalizeWorkSchedule(left)
  const normalizedRight = normalizeWorkSchedule(right)

  return normalizedLeft.every((day, index) => {
    const rightDay = normalizedRight[index]

    return (
      day.dayOfWeek === rightDay?.dayOfWeek &&
      day.isWorkingDay === rightDay?.isWorkingDay &&
      day.startMinute === rightDay?.startMinute &&
      day.endMinute === rightDay?.endMinute &&
      day.breakMinute === rightDay?.breakMinute
    )
  })
}

export function resolveWorkScheduleDayMinutes(day: WorkScheduleDay): number {
  if (!day.isWorkingDay || day.startMinute === null || day.endMinute === null) {
    return 0
  }

  const workSpanMinutes = Math.max(0, day.endMinute - day.startMinute)
  const breakMinute = day.breakMinute ?? 0

  return Math.max(0, workSpanMinutes - breakMinute)
}

export function deriveLegacyWorkSettingsFromSchedule(schedule: WorkSchedule): {
  monthlyWorkHours: number
  workDaysPerYear: number
} {
  const normalized = normalizeWorkSchedule(schedule)
  const weeklyWorkDays = normalized.reduce(
    (total, day) => total + (day.isWorkingDay ? 1 : 0),
    0
  )
  const weeklyWorkMinutes = normalized.reduce(
    (total, day) => total + resolveWorkScheduleDayMinutes(day),
    0
  )

  const workDaysPerYear = clampInteger(Math.round((weeklyWorkDays * 365) / 7), 1, 366)
  const monthlyWorkHours = clampInteger(
    Math.round(((weeklyWorkMinutes / 60) * 365) / (7 * 12)),
    1,
    744
  )

  return {
    monthlyWorkHours,
    workDaysPerYear,
  }
}

export function minuteToTimeValue(minute: number | null): string {
  if (minute === null || !Number.isFinite(minute) || minute < 0 || minute > 1440) {
    return ""
  }

  const safeMinute = Math.min(1439, Math.max(0, Math.round(minute)))
  const hours = Math.floor(safeMinute / 60)
  const minutes = safeMinute % 60

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

export function timeValueToMinute(value: string): number | null {
  const normalized = value.trim()

  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return null
  }

  const [hoursPart, minutesPart] = normalized.split(":")
  const hours = Number(hoursPart)
  const minutes = Number(minutesPart)

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return hours * 60 + minutes
}

export function minuteToDurationValue(minute: number | null): string {
  if (minute === null || !Number.isFinite(minute) || minute < 0 || minute > 1439) {
    return ""
  }

  const safeMinute = Math.max(0, Math.min(1439, Math.round(minute)))
  const hours = Math.floor(safeMinute / 60)
  const minutes = safeMinute % 60

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

export function durationValueToMinute(value: string): number | null {
  const normalized = value.trim()

  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return null
  }

  const [hoursPart, minutesPart] = normalized.split(":")
  const hours = Number(hoursPart)
  const minutes = Number(minutesPart)

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return hours * 60 + minutes
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}
