import { describe, expect, it } from "vitest"

import {
  areWorkSchedulesEqual,
  buildDefaultWorkSchedule,
  normalizeWorkSchedule,
  resolveWorkScheduleDayMinutes,
  workScheduleSchema,
} from "@/app/lib/models/work-schedule/work-schedule.model"

describe("work schedule model", () => {
  it("subtracts break minutes from worked minutes", () => {
    const monday = {
      dayOfWeek: 1 as const,
      isWorkingDay: true,
      startMinute: 5 * 60,
      endMinute: 14 * 60,
      breakMinute: 60,
    }

    expect(resolveWorkScheduleDayMinutes(monday)).toBe(8 * 60)
  })

  it("allows zero break minutes for working days", () => {
    const schedule = buildDefaultWorkSchedule().map((day) => ({
      ...day,
      breakMinute: day.isWorkingDay ? 0 : null,
    }))

    const result = workScheduleSchema.safeParse(schedule)
    expect(result.success).toBe(true)
  })

  it("rejects break minutes equal to worked span", () => {
    const schedule = buildDefaultWorkSchedule().map((day) => {
      if (day.dayOfWeek !== 1) {
        return day
      }

      return {
        ...day,
        startMinute: 9 * 60,
        endMinute: 10 * 60,
        breakMinute: 60,
      }
    })

    const result = workScheduleSchema.safeParse(schedule)
    expect(result.success).toBe(false)
  })

  it("rejects break minutes in non-working days", () => {
    const schedule = buildDefaultWorkSchedule().map((day) => {
      if (day.dayOfWeek !== 7) {
        return day
      }

      return {
        ...day,
        isWorkingDay: false,
        startMinute: null,
        endMinute: null,
        breakMinute: 30,
      }
    })

    const result = workScheduleSchema.safeParse(schedule)
    expect(result.success).toBe(false)
  })

  it("normalizes legacy schedules without break minutes", () => {
    const legacySchedule = buildDefaultWorkSchedule().map((day) => ({
      dayOfWeek: day.dayOfWeek,
      isWorkingDay: day.isWorkingDay,
      startMinute: day.startMinute,
      endMinute: day.endMinute,
    }))

    const normalized = normalizeWorkSchedule(
      legacySchedule as unknown as Parameters<typeof normalizeWorkSchedule>[0]
    )
    const monday = normalized.find((day) => day.dayOfWeek === 1)
    const sunday = normalized.find((day) => day.dayOfWeek === 7)

    expect(monday?.breakMinute).toBe(0)
    expect(sunday?.breakMinute).toBeNull()
  })

  it("normalizes non-working days with omitted time fields without falling back", () => {
    const apiSchedule = buildDefaultWorkSchedule().map((day) => {
      if (day.dayOfWeek === 1) {
        return {
          ...day,
          startMinute: 10 * 60,
          endMinute: 17 * 60,
        }
      }

      if (!day.isWorkingDay) {
        return {
          dayOfWeek: day.dayOfWeek,
          isWorkingDay: false,
        }
      }

      return day
    })

    const normalized = normalizeWorkSchedule(
      apiSchedule as unknown as Parameters<typeof normalizeWorkSchedule>[0]
    )
    const monday = normalized.find((day) => day.dayOfWeek === 1)
    const saturday = normalized.find((day) => day.dayOfWeek === 6)

    expect(monday?.startMinute).toBe(10 * 60)
    expect(monday?.endMinute).toBe(17 * 60)
    expect(saturday?.startMinute).toBeNull()
    expect(saturday?.endMinute).toBeNull()
  })

  it("considers schedules equal even with different input order", () => {
    const schedule = buildDefaultWorkSchedule()
    const shuffled = [...schedule].reverse()

    expect(areWorkSchedulesEqual(schedule, shuffled)).toBe(true)
  })

  it("returns false when only one schedule is null", () => {
    const schedule = buildDefaultWorkSchedule()

    expect(areWorkSchedulesEqual(schedule, null)).toBe(false)
    expect(areWorkSchedulesEqual(null, schedule)).toBe(false)
  })
})
