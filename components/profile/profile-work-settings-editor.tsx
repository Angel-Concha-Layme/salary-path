"use client"

import { useMemo, useState } from "react"
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
        "pointer-events-none grid h-[82px] w-[104px] shrink-0 grid-rows-2 place-items-center rounded-md border p-1 shadow-sm",
        isActive
          ? "border-primary-foreground/75 bg-primary-foreground text-primary"
          : "border-primary/45 bg-primary/15 text-primary"
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
    <section className="rounded-lg border border-border/80 bg-background p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-primary/80">
          {dictionary.profile.workSettings.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {dictionary.profile.workSettings.description}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary/70">
          {dictionary.profile.workSettings.presetsLabel}
        </p>
        <div className="mt-2 grid gap-2 lg:grid-cols-2">
          {WORK_SCHEDULE_PRESETS.map((preset) => {
            const isActive = selectedPresetId === preset.id

            return (
              <Button
                key={preset.id}
                type="button"
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "h-auto w-full min-w-0 justify-start whitespace-normal px-3 py-2.5 text-left",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => applyPreset(preset)}
              >
                <span className="flex w-full min-w-0 items-center justify-between gap-2">
                  <span
                    className={cn(
                      "grid min-w-0 flex-1 grid-cols-1 items-start gap-1 sm:grid-cols-[minmax(116px,0.85fr)_minmax(0,1.8fr)] sm:gap-2.5",
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

      <div className="mt-4 grid gap-3 md:grid-cols-2">
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
          <FieldDescription>
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
          <FieldDescription>
            {dictionary.profile.workSettings.hints.workDaysPerYear}
          </FieldDescription>
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
        <span className="text-xs text-muted-foreground">
          {dictionary.profile.workSettings.hints.affectsCalculations}
        </span>
      </div>
    </section>
  )
}
