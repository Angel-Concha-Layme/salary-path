"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { toast } from "sonner"

import {
  useCreateUserFinanceSettingsMutation,
  useUpdateUserFinanceSettingsMutation,
  useUserFinanceSettingsListQuery,
} from "@/app/hooks/settings/use-user-finance-settings"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import type { CurrencyCodeValue } from "@/app/lib/models/common/domain-enums"
import { ApiClientError } from "@/app/types/api"
import { NumberStepperInput } from "@/components/onboarding/number-stepper-input"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

const MONTHLY_WORK_HOURS_MIN = 1
const MONTHLY_WORK_HOURS_MAX = 744
const WORK_DAYS_PER_YEAR_MIN = 1
const WORK_DAYS_PER_YEAR_MAX = 366
const WEEKS_PER_YEAR = 52.2

type WorkPresetId =
  | "fullTime"
  | "reducedDay"
  | "halfTime"
  | "flexible"

interface ProfileWorkSettingsEditorProps {
  currency: CurrencyCodeValue
  locale: string
  monthlyWorkHours: number
  workDaysPerYear: number
  showDescription?: boolean
}

interface WorkSchedulePreset {
  id: WorkPresetId
  hoursPerDay: number
  daysPerWeek: number
  monthlyWorkHours: number
  workDaysPerYear: number
}

interface WorkSettingsDraft {
  monthlyWorkHours: number
  workDaysPerYear: number
}

interface WorkloadSquareProps {
  hoursPerDay: number
  daysPerWeek: number
  monthlyWorkHours: number
  workDaysPerYear: number
  isActive: boolean
  dayShortLabel: string
  weekShortLabel: string
  monthlyShortLabel: string
  yearlyShortLabel: string
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function buildPreset(
  id: WorkPresetId,
  hoursPerDay: number,
  daysPerWeek: number
): WorkSchedulePreset {
  const workDaysPerYear = clampInteger(
    daysPerWeek * WEEKS_PER_YEAR,
    WORK_DAYS_PER_YEAR_MIN,
    WORK_DAYS_PER_YEAR_MAX
  )
  const monthlyWorkHours = clampInteger(
    (hoursPerDay * workDaysPerYear) / 12,
    MONTHLY_WORK_HOURS_MIN,
    MONTHLY_WORK_HOURS_MAX
  )

  return {
    id,
    hoursPerDay,
    daysPerWeek,
    monthlyWorkHours,
    workDaysPerYear,
  }
}

const WORK_SCHEDULE_PRESETS: WorkSchedulePreset[] = [
  buildPreset("fullTime", 8, 5),
  buildPreset("reducedDay", 6, 5),
  buildPreset("halfTime", 4, 5),
  buildPreset("flexible", 3, 3),
]

function WorkloadSquare({
  hoursPerDay,
  daysPerWeek,
  monthlyWorkHours,
  workDaysPerYear,
  isActive,
  dayShortLabel,
  weekShortLabel,
  monthlyShortLabel,
  yearlyShortLabel,
}: WorkloadSquareProps) {
  return (
    <span
      className={cn(
        "pointer-events-none grid h-[82px] w-[104px] shrink-0 grid-rows-2 place-items-center rounded-md border p-1",
        isActive
          ? "border-primary/45 bg-white text-black dark:bg-black dark:text-white"
          : "border-border/70 bg-background text-foreground"
      )}
    >
      <span className="grid w-full grid-cols-2 gap-1.5 leading-none">
        <span className="flex min-w-0 flex-col items-center justify-center text-center">
          <span className="text-[0.84rem] font-semibold">{hoursPerDay}</span>
          <span className="mt-0.5 text-[0.5rem] uppercase tracking-[0.05em] opacity-90">
            {dayShortLabel}
          </span>
        </span>
        <span className="flex min-w-0 flex-col items-center justify-center text-center">
          <span className="text-[0.84rem] font-semibold">{daysPerWeek}</span>
          <span className="mt-0.5 text-[0.5rem] uppercase tracking-[0.05em] opacity-90">
            {weekShortLabel}
          </span>
        </span>
      </span>
      <span className="grid w-full grid-cols-2 gap-1.5 leading-none">
        <span className="flex min-w-0 flex-col items-center justify-center text-center">
          <span className="text-[0.84rem] font-semibold">{monthlyWorkHours}</span>
          <span className="mt-0.5 text-[0.5rem] uppercase tracking-[0.05em] opacity-90">
            {monthlyShortLabel}
          </span>
        </span>
        <span className="flex min-w-0 flex-col items-center justify-center text-center">
          <span className="text-[0.84rem] font-semibold">{workDaysPerYear}</span>
          <span className="mt-0.5 text-[0.5rem] uppercase tracking-[0.05em] opacity-90">
            {yearlyShortLabel}
          </span>
        </span>
      </span>
    </span>
  )
}

export function ProfileWorkSettingsEditor({
  currency,
  locale,
  monthlyWorkHours,
  workDaysPerYear,
  showDescription = true,
}: ProfileWorkSettingsEditorProps) {
  const { dictionary } = useDictionary()
  const settingsListQuery = useUserFinanceSettingsListQuery({ limit: 1 })
  const createSettingsMutation = useCreateUserFinanceSettingsMutation()
  const updateSettingsMutation = useUpdateUserFinanceSettingsMutation()
  const [draft, setDraft] = useState<WorkSettingsDraft | null>(null)

  const effectiveMonthlyWorkHours = draft?.monthlyWorkHours ?? monthlyWorkHours
  const effectiveWorkDaysPerYear = draft?.workDaysPerYear ?? workDaysPerYear
  const hasChanges =
    effectiveMonthlyWorkHours !== monthlyWorkHours ||
    effectiveWorkDaysPerYear !== workDaysPerYear
  const isSaving =
    createSettingsMutation.isPending || updateSettingsMutation.isPending

  const settingsId = settingsListQuery.data?.items[0]?.id ?? null

  const selectedPresetId = useMemo(() => {
    const selectedPreset = WORK_SCHEDULE_PRESETS.find(
      (preset) =>
        preset.monthlyWorkHours === effectiveMonthlyWorkHours &&
        preset.workDaysPerYear === effectiveWorkDaysPerYear
    )

    return selectedPreset?.id ?? null
  }, [effectiveMonthlyWorkHours, effectiveWorkDaysPerYear])

  const presetLabels: Record<WorkPresetId, string> = {
    fullTime: dictionary.profile.workSettings.presets.fullTime,
    reducedDay: dictionary.profile.workSettings.presets.reducedDay,
    halfTime: dictionary.profile.workSettings.presets.halfTime,
    flexible: dictionary.profile.workSettings.presets.flexible,
  }
  const presetDetails: Record<WorkPresetId, string> = {
    fullTime: dictionary.profile.workSettings.presetDetails.fullTime,
    reducedDay: dictionary.profile.workSettings.presetDetails.reducedDay,
    halfTime: dictionary.profile.workSettings.presetDetails.halfTime,
    flexible: dictionary.profile.workSettings.presetDetails.flexible,
  }
  const monthlyShortLabel = dictionary.profile.workSettings.metrics.monthlyShort
  const yearlyShortLabel = dictionary.profile.workSettings.metrics.yearlyShort
  const dayShortLabel = dictionary.profile.workSettings.metrics.dayShort
  const weekShortLabel = dictionary.profile.workSettings.metrics.weekShort
  const presetsScrollerRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isPresetScrollable, setIsPresetScrollable] = useState(false)
  const presetScrollButtonClassName =
    "size-7 rounded-full border-[color-mix(in_oklch,var(--ui-accent-current)_38%,transparent)] bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)] text-[var(--ui-accent-current)] hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_18%,transparent)] hover:text-[var(--ui-accent-current)] disabled:border-[color-mix(in_oklch,var(--ui-accent-current)_20%,transparent)] disabled:bg-[color-mix(in_oklch,var(--ui-accent-current)_8%,transparent)] disabled:text-[color-mix(in_oklch,var(--ui-accent-current)_46%,transparent)]"

  const updatePresetScrollerState = useCallback(() => {
    const container = presetsScrollerRef.current

    if (!container) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      setIsPresetScrollable(false)
      return
    }

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth)
    setIsPresetScrollable(maxScrollLeft > 1)
    setCanScrollLeft(container.scrollLeft > 1)
    setCanScrollRight(container.scrollLeft < maxScrollLeft - 1)
  }, [])

  useEffect(() => {
    const container = presetsScrollerRef.current

    if (!container) {
      return
    }

    const handleScroll = () => {
      updatePresetScrollerState()
    }

    updatePresetScrollerState()

    container.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", updatePresetScrollerState)

    return () => {
      container.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", updatePresetScrollerState)
    }
  }, [updatePresetScrollerState])

  const scrollPresets = (direction: "left" | "right") => {
    const container = presetsScrollerRef.current

    if (!container) {
      return
    }

    const step = Math.max(220, Math.round(container.clientWidth * 0.72))

    container.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    })
  }

  const updateMonthlyWorkHours = (value: number) => {
    setDraft((previous) => ({
      monthlyWorkHours: clampInteger(
        value,
        MONTHLY_WORK_HOURS_MIN,
        MONTHLY_WORK_HOURS_MAX
      ),
      workDaysPerYear: previous?.workDaysPerYear ?? workDaysPerYear,
    }))
  }

  const updateWorkDaysPerYear = (value: number) => {
    setDraft((previous) => ({
      monthlyWorkHours: previous?.monthlyWorkHours ?? monthlyWorkHours,
      workDaysPerYear: clampInteger(
        value,
        WORK_DAYS_PER_YEAR_MIN,
        WORK_DAYS_PER_YEAR_MAX
      ),
    }))
  }

  const applyPreset = (preset: WorkSchedulePreset) => {
    setDraft({
      monthlyWorkHours: preset.monthlyWorkHours,
      workDaysPerYear: preset.workDaysPerYear,
    })
  }

  const resetDraft = () => {
    setDraft(null)
  }

  const saveChanges = async () => {
    if (!hasChanges || isSaving) {
      return
    }

    const payload = {
      monthlyWorkHours: effectiveMonthlyWorkHours,
      workDaysPerYear: effectiveWorkDaysPerYear,
    }

    try {
      if (settingsId) {
        await updateSettingsMutation.mutateAsync({
          id: settingsId,
          input: payload,
        })
      } else {
        try {
          await createSettingsMutation.mutateAsync({
            currency,
            locale,
            ...payload,
          })
        } catch (error) {
          if (!(error instanceof ApiClientError) || error.code !== "CONFLICT") {
            throw error
          }

          const refetched = await settingsListQuery.refetch()
          const recoveredId = refetched.data?.items[0]?.id

          if (!recoveredId) {
            throw error
          }

          await updateSettingsMutation.mutateAsync({
            id: recoveredId,
            input: payload,
          })
        }
      }

      toast.success(dictionary.profile.workSettings.toasts.saved)
      setDraft(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : dictionary.common.unknownError
      toast.error(message)
    }
  }

  return (
    <section className="rounded-2xl bg-background/80 p-3 md:p-4">
      {showDescription ? (
        <p className="text-sm text-muted-foreground">
          {dictionary.profile.workSettings.description}
        </p>
      ) : null}

      <div className={cn(showDescription ? "mt-4" : "mt-0")}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {dictionary.profile.workSettings.presetsLabel}
          </p>
          <div
            className={cn(
              "flex items-center gap-1 transition-opacity",
              isPresetScrollable ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <Button
              type="button"
              size="icon"
              variant="outline"
              className={presetScrollButtonClassName}
              onClick={() => scrollPresets("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll presets left"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className={presetScrollButtonClassName}
              onClick={() => scrollPresets("right")}
              disabled={!canScrollRight}
              aria-label="Scroll presets right"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
        <div
          ref={presetsScrollerRef}
          className="no-scrollbar mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {WORK_SCHEDULE_PRESETS.map((preset) => {
            const isActive = selectedPresetId === preset.id

            return (
              <Button
                key={preset.id}
                type="button"
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "h-auto w-[78vw] max-w-[320px] min-w-[260px] snap-start justify-start whitespace-normal px-3 py-2.5 text-left",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => applyPreset(preset)}
              >
                <span className="flex w-full min-w-0 items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex min-w-0 flex-1 flex-col items-start gap-1",
                    )}
                  >
                    <span className="break-words text-[0.86rem] font-normal leading-tight sm:text-sm">
                      {presetLabels[preset.id]}
                    </span>
                    <span
                      className={cn(
                      "min-w-0 break-words text-[0.74rem] leading-snug sm:text-xs",
                      isActive
                        ? "text-primary-foreground/90"
                        : "text-muted-foreground"
                    )}
                  >
                      {presetDetails[preset.id]}
                    </span>
                  </span>
                  <WorkloadSquare
                    hoursPerDay={preset.hoursPerDay}
                    daysPerWeek={preset.daysPerWeek}
                    monthlyWorkHours={preset.monthlyWorkHours}
                    workDaysPerYear={preset.workDaysPerYear}
                    isActive={isActive}
                    dayShortLabel={dayShortLabel}
                    weekShortLabel={weekShortLabel}
                    monthlyShortLabel={monthlyShortLabel}
                    yearlyShortLabel={yearlyShortLabel}
                  />
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:gap-3">
        <Field>
          <FieldLabel htmlFor="profile-monthly-work-hours">
            {dictionary.onboarding.fields.monthlyWorkHours}
          </FieldLabel>
          <NumberStepperInput
            id="profile-monthly-work-hours"
            name="profile-monthly-work-hours"
            value={effectiveMonthlyWorkHours}
            min={MONTHLY_WORK_HOURS_MIN}
            max={MONTHLY_WORK_HOURS_MAX}
            step={1}
            disabled={isSaving}
            onChange={updateMonthlyWorkHours}
          />
          <FieldDescription className="hidden md:block">
            {dictionary.profile.workSettings.hints.monthlyWorkHours}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-work-days-per-year">
            {dictionary.onboarding.fields.workDaysPerYear}
          </FieldLabel>
          <NumberStepperInput
            id="profile-work-days-per-year"
            name="profile-work-days-per-year"
            value={effectiveWorkDaysPerYear}
            min={WORK_DAYS_PER_YEAR_MIN}
            max={WORK_DAYS_PER_YEAR_MAX}
            step={1}
            disabled={isSaving}
            onChange={updateWorkDaysPerYear}
          />
          <FieldDescription className="hidden md:block">
            {dictionary.profile.workSettings.hints.workDaysPerYear}
          </FieldDescription>
        </Field>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="text-xs text-muted-foreground">
          {dictionary.profile.workSettings.hints.affectsCalculations}
        </span>
        <div className="flex w-full justify-end gap-2 sm:ml-auto sm:w-auto">
          <Button
            type="button"
            size="sm"
            onClick={saveChanges}
            disabled={!hasChanges || isSaving}
          >
            {isSaving
              ? dictionary.profile.workSettings.actions.saving
              : dictionary.profile.workSettings.actions.save}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={resetDraft}
            disabled={!hasChanges || isSaving}
          >
            {dictionary.profile.workSettings.actions.reset}
          </Button>
        </div>
      </div>
    </section>
  )
}
