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
import {
  buildDefaultWorkSchedule,
  deriveLegacyWorkSettingsFromSchedule,
  normalizeWorkSchedule,
  type WorkSchedule,
} from "@/app/lib/models/work-schedule/work-schedule.model"
import { ApiClientError } from "@/app/types/api"
import { WorkScheduleEditor } from "@/components/work-schedule-editor"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProfileWorkSettingsEditorProps {
  currency: CurrencyCodeValue
  locale: string
  monthlyWorkHours: number
  workDaysPerYear: number
  hasHourlyCompany: boolean
  showDescription?: boolean
}

function areSchedulesEqual(left: WorkSchedule, right: WorkSchedule): boolean {
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftDay = left[index]
    const rightDay = right[index]

    if (!leftDay || !rightDay) {
      return false
    }

    if (
      leftDay.dayOfWeek !== rightDay.dayOfWeek ||
      leftDay.isWorkingDay !== rightDay.isWorkingDay ||
      leftDay.startMinute !== rightDay.startMinute ||
      leftDay.endMinute !== rightDay.endMinute ||
      leftDay.breakMinute !== rightDay.breakMinute
    ) {
      return false
    }
  }

  return true
}

export function ProfileWorkSettingsEditor({
  currency,
  locale,
  monthlyWorkHours,
  workDaysPerYear,
  hasHourlyCompany,
  showDescription = true,
}: ProfileWorkSettingsEditorProps) {
  const { dictionary } = useDictionary()
  const settingsListQuery = useUserFinanceSettingsListQuery({ limit: 1 })
  const createSettingsMutation = useCreateUserFinanceSettingsMutation()
  const updateSettingsMutation = useUpdateUserFinanceSettingsMutation()
  const [draft, setDraft] = useState<WorkSchedule | null>(null)

  const settings = settingsListQuery.data?.items[0] ?? null
  const settingsId = settings?.id ?? null
  const persistedSchedule = useMemo(
    () => normalizeWorkSchedule(settings?.defaultWorkSchedule ?? buildDefaultWorkSchedule()),
    [settings?.defaultWorkSchedule]
  )
  const effectiveSchedule = useMemo(
    () => normalizeWorkSchedule(draft ?? persistedSchedule),
    [draft, persistedSchedule]
  )
  const derivedMetrics = useMemo(
    () => deriveLegacyWorkSettingsFromSchedule(effectiveSchedule),
    [effectiveSchedule]
  )
  const fallbackMonthlyWorkHours = monthlyWorkHours > 0 ? monthlyWorkHours : derivedMetrics.monthlyWorkHours
  const fallbackWorkDaysPerYear = workDaysPerYear > 0 ? workDaysPerYear : derivedMetrics.workDaysPerYear
  const hasChanges = !areSchedulesEqual(effectiveSchedule, persistedSchedule)
  const isSaving = createSettingsMutation.isPending || updateSettingsMutation.isPending

  const handleScheduleChange = (nextSchedule: WorkSchedule) => {
    const normalized = normalizeWorkSchedule(nextSchedule)

    if (areSchedulesEqual(normalized, persistedSchedule)) {
      setDraft(null)
      return
    }

    setDraft(normalized)
  }

  const saveChanges = async () => {
    if (!hasChanges || isSaving) {
      return
    }

    try {
      if (settingsId) {
        await updateSettingsMutation.mutateAsync({
          id: settingsId,
          input: {
            defaultWorkSchedule: effectiveSchedule,
          },
        })
      } else {
        try {
          await createSettingsMutation.mutateAsync({
            currency,
            locale,
            defaultWorkSchedule: effectiveSchedule,
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
            input: {
              defaultWorkSchedule: effectiveSchedule,
            },
          })
        }
      }

      toast.success(dictionary.profile.workSettings.toasts.saved)
      setDraft(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : dictionary.common.unknownError
      toast.error(message)
    }
  }

  const resetDraft = () => {
    setDraft(null)
  }

  return (
    <section className="rounded-2xl bg-background/80 p-3 md:p-4">
      {showDescription ? (
        <p className="text-sm text-muted-foreground">
          {dictionary.profile.workSettings.description}
        </p>
      ) : null}

      <WorkScheduleEditor
        className={cn(showDescription ? "mt-4" : "mt-0")}
        value={effectiveSchedule}
        onChange={handleScheduleChange}
        disabled={isSaving}
        showDescription={false}
        showBreakMinute={hasHourlyCompany}
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {dictionary.profile.useful.monthlyWorkHours}
          </p>
          <p className="text-sm font-semibold">{derivedMetrics.monthlyWorkHours || fallbackMonthlyWorkHours}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {dictionary.profile.useful.workDaysPerYear}
          </p>
          <p className="text-sm font-semibold">{derivedMetrics.workDaysPerYear || fallbackWorkDaysPerYear}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {dictionary.profile.workSettings.hints.affectsCalculations}
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={resetDraft}
          disabled={!hasChanges || isSaving}
        >
          {dictionary.profile.workSettings.actions.reset}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => void saveChanges()}
          disabled={!hasChanges || isSaving}
        >
          {isSaving
            ? dictionary.profile.workSettings.actions.saving
            : dictionary.profile.workSettings.actions.save}
        </Button>
      </div>
    </section>
  )
}
