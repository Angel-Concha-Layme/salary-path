"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useStore } from "@tanstack/react-store"
import { InfoIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { useCompanyCatalogListQuery } from "@/app/hooks/companies/use-company-catalog"
import { useRoleCatalogListQuery } from "@/app/hooks/roles/use-role-catalog"
import { useCompleteOnboardingMutation } from "@/app/hooks/onboarding/use-onboarding"
import {
  CompensationType,
  PathCompanyEventType,
  isCompensationType,
} from "@/app/lib/models/common/domain-enums"
import {
  buildOnboardingAdditionalCompanyDraft,
  buildOnboardingCompanyEventDraft,
  currencyOptions,
  getCompensationRateStep,
  onboardingDefaultValues,
  onboardingEventTypeOptions,
  onboardingFormSchema,
  onboardingStep4Schema,
  onboardingStepSchemas,
  normalizeOnboardingCalendarDate,
  resolveDefaultEventDate,
  resolveDefaultPreviousCompanyEndDate,
  serializeOnboardingCalendarDate,
  type OnboardingAdditionalCompanyDraft,
  type OnboardingCompanyEventDraft,
  type OnboardingEventType,
  type OnboardingFormValues,
} from "@/app/lib/models/onboarding/onboarding-form.model"
import {
  normalizeWorkSchedule,
  type WorkSchedule,
} from "@/app/lib/models/work-schedule/work-schedule.model"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { NumberStepperInput } from "@/components/onboarding/number-stepper-input"
import { OnboardingWizardShell } from "@/components/onboarding/onboarding-wizard-shell"
import { SingleDatePickerField } from "@/components/shared/single-date-picker-field"
import { WorkScheduleEditor } from "@/components/work-schedule-editor"
import { WorkScheduleSummary } from "@/components/work-schedule-summary"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const TOTAL_STEPS = 4
const COMPLETION_ANIMATION_DURATION_MS = 1500
const DEFAULT_WORK_SCHEDULE = normalizeWorkSchedule(onboardingDefaultValues.defaultWorkSchedule)

const STEP_FIELD_NAMES: Array<Array<keyof OnboardingFormValues>> = [
  ["companyName", "roleName", "startDate"],
  ["compensationType", "currency", "startRate", "events"],
  ["defaultWorkSchedule"],
  ["additionalCompanies"],
]

interface TimelineEventItem {
  id: string
  eventType: string
  effectiveDate: Date
  amount: number
  derived?: boolean
}

function areWorkSchedulesEqual(left: WorkSchedule, right: WorkSchedule): boolean {
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftDay = left[index]
    const rightDay = right[index]

    if (
      !rightDay ||
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

function sortTimelineEvents(events: TimelineEventItem[]): TimelineEventItem[] {
  return [...events].sort((left, right) => {
    const byDate = left.effectiveDate.getTime() - right.effectiveDate.getTime()

    if (byDate !== 0) {
      return byDate
    }

    if (left.eventType === PathCompanyEventType.END_OF_EMPLOYMENT) {
      return 1
    }

    if (right.eventType === PathCompanyEventType.END_OF_EMPLOYMENT) {
      return -1
    }

    return left.id.localeCompare(right.id)
  })
}

function buildCurrentCompanyTimeline(values: OnboardingFormValues): TimelineEventItem[] {
  if (!values.startDate) {
    return []
  }

  const baseEvents: TimelineEventItem[] = [
    {
      id: "start-event",
      eventType: PathCompanyEventType.START_RATE,
      effectiveDate: values.startDate,
      amount: values.startRate,
      derived: true,
    },
  ]

  values.events.forEach((event) => {
    if (!event.effectiveDate) {
      return
    }

    baseEvents.push({
      id: event.id,
      eventType: event.eventType,
      effectiveDate: event.effectiveDate,
      amount: event.amount,
      derived: false,
    })
  })

  return sortTimelineEvents(baseEvents)
}

function buildAdditionalCompanyTimeline(company: OnboardingAdditionalCompanyDraft): TimelineEventItem[] {
  if (!company.startDate) {
    return []
  }

  const timeline: TimelineEventItem[] = [
    {
      id: `${company.id}-start`,
      eventType: PathCompanyEventType.START_RATE,
      effectiveDate: company.startDate,
      amount: company.startRate,
      derived: true,
    },
  ]

  company.events.forEach((event) => {
    if (!event.effectiveDate) {
      return
    }

    timeline.push({
      id: event.id,
      eventType: event.eventType,
      effectiveDate: event.effectiveDate,
      amount: event.amount,
    })
  })

  const sorted = sortTimelineEvents(timeline)

  if (company.endDate) {
    const lastCompensationEvent = [...sorted]
      .filter((event) => event.eventType !== PathCompanyEventType.END_OF_EMPLOYMENT)
      .at(-1)

    sorted.push({
      id: `${company.id}-end`,
      eventType: PathCompanyEventType.END_OF_EMPLOYMENT,
      effectiveDate: company.endDate,
      amount: lastCompensationEvent?.amount ?? company.startRate,
      derived: true,
    })
  }

  return sortTimelineEvents(sorted)
}

function formatAmount(locale: string, currency: string, amount: number): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function HelpTooltip({ text }: { text?: string }) {
  if (!text) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="h-5 w-5 rounded-full text-muted-foreground"
          aria-label={text}
        >
          <InfoIcon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{text}</TooltipContent>
    </Tooltip>
  )
}

function FieldLabelWithTooltip({
  htmlFor,
  label,
  tooltip,
}: {
  htmlFor: string
  label: string
  tooltip?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      <HelpTooltip text={tooltip} />
    </div>
  )
}

function isOnboardingEventType(value: string): value is OnboardingEventType {
  return onboardingEventTypeOptions.includes(value as OnboardingEventType)
}

export function OnboardingWizard() {
  const router = useRouter()
  const { dictionary, locale } = useDictionary()
  const completeOnboardingMutation = useCompleteOnboardingMutation()
  const [step, setStep] = useState(0)
  const [companySearch, setCompanySearch] = useState("")
  const [roleSearch, setRoleSearch] = useState("")
  const [isShowingCompletionAnimation, setIsShowingCompletionAnimation] = useState(false)
  const [isCurrentScheduleDialogOpen, setIsCurrentScheduleDialogOpen] = useState(false)
  const [isAdditionalCompanyDialogOpen, setIsAdditionalCompanyDialogOpen] = useState(false)
  const [isEditingAdditionalCompany, setIsEditingAdditionalCompany] = useState(false)
  const [additionalCompanyDraft, setAdditionalCompanyDraft] = useState<OnboardingAdditionalCompanyDraft | null>(
    null
  )

  const companyCatalogQuery = useCompanyCatalogListQuery({
    limit: 10,
    search: companySearch.trim() || undefined,
  })
  const roleCatalogQuery = useRoleCatalogListQuery({
    limit: 10,
    search: roleSearch.trim() || undefined,
  })

  const form = useForm({
    defaultValues: onboardingDefaultValues,
    validators: {
      onChange: onboardingFormSchema,
      onBlur: onboardingFormSchema,
      onSubmit: onboardingFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!value.startDate) {
        return
      }

      const submitStartedAt = Date.now()
      setIsShowingCompletionAnimation(true)

      try {
        const primaryCompany = {
          companyName: value.companyName.trim(),
          roleName: value.roleName.trim(),
          startDate: serializeOnboardingCalendarDate(value.startDate),
          endDate: null,
          compensationType: value.compensationType,
          currency: value.currency,
          startRate: value.startRate,
          events: value.events
            .filter((event) => event.effectiveDate !== null)
            .map((event) => {
              const normalizedNotes = event.notes.trim()

              return {
                eventType: event.eventType,
                effectiveDate: serializeOnboardingCalendarDate(event.effectiveDate as Date),
                amount: event.amount,
                notes: normalizedNotes.length > 0 ? normalizedNotes : null,
              }
            }),
          workSchedule: value.defaultWorkSchedule,
        }

        const additionalCompanies = value.additionalCompanies
          .filter((company) => company.startDate !== null)
          .map((company) => ({
            companyName: company.companyName.trim(),
            roleName: company.roleName.trim(),
            startDate: serializeOnboardingCalendarDate(company.startDate as Date),
            endDate:
              company.isCurrentJob || !company.endDate
                ? null
                : serializeOnboardingCalendarDate(company.endDate),
            compensationType: company.compensationType,
            currency: company.currency,
            startRate: company.startRate,
            events: company.events
              .filter((event) => event.effectiveDate !== null)
              .map((event) => {
                const normalizedNotes = event.notes.trim()

                return {
                  eventType: event.eventType,
                  effectiveDate: serializeOnboardingCalendarDate(event.effectiveDate as Date),
                  amount: event.amount,
                  notes: normalizedNotes.length > 0 ? normalizedNotes : null,
                }
              }),
            workSchedule: company.workSchedule,
          }))

        await completeOnboardingMutation.mutateAsync({
          defaultWorkSchedule: value.defaultWorkSchedule,
          companies: [primaryCompany, ...additionalCompanies],
          locale,
        })

        const elapsedMs = Date.now() - submitStartedAt
        if (elapsedMs < COMPLETION_ANIMATION_DURATION_MS) {
          await new Promise((resolve) =>
            setTimeout(resolve, COMPLETION_ANIMATION_DURATION_MS - elapsedMs)
          )
        }

        toast.success(dictionary.onboarding.toasts.success)
        router.push("/career-path/salary-tracking")
        router.refresh()
      } catch (error) {
        setIsShowingCompletionAnimation(false)
        const message = error instanceof Error ? error.message : dictionary.common.unknownError
        toast.error(message)
      }
    },
    onSubmitInvalid: () => {
      toast.error(dictionary.common.unknownError)
    },
  })

  const formValues = useStore(form.store, (state) => state.values)

  const isUsingDefaultWorkSchedule = useMemo(
    () =>
      areWorkSchedulesEqual(
        normalizeWorkSchedule(formValues.defaultWorkSchedule),
        DEFAULT_WORK_SCHEDULE
      ),
    [formValues.defaultWorkSchedule]
  )

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }),
    [locale]
  )

  const companyOptions = useMemo(() => {
    const catalogNames = (companyCatalogQuery.data?.items ?? []).map((c) => c.name)
    const current = formValues.companyName
    return current ? Array.from(new Set([current, ...catalogNames])) : catalogNames
  }, [companyCatalogQuery.data?.items, formValues.companyName])

  const roleOptions = useMemo(() => {
    const catalogNames = (roleCatalogQuery.data?.items ?? []).map((r) => r.name)
    const current = formValues.roleName
    return current ? Array.from(new Set([current, ...catalogNames])) : catalogNames
  }, [roleCatalogQuery.data?.items, formValues.roleName])

  const progressLabel = dictionary.onboarding.stepProgress
    .replace("{current}", String(step + 1))
    .replace("{total}", String(TOTAL_STEPS))

  const compensationRateStep = getCompensationRateStep(
    formValues.compensationType,
    formValues.currency
  )

  const eventTypeLabels = {
    ...(dictionary.companies.eventTypes as Record<string, string>),
    ...(dictionary.onboarding.eventTypeLabels as Record<string, string>),
  } satisfies Record<string, string>

  const currentCompanyTimeline = useMemo(
    () => buildCurrentCompanyTimeline(formValues),
    [formValues]
  )

  useEffect(() => {
    if (formValues.additionalCompanies.length === 0) {
      return
    }

    let changed = false
    const nextCompanies = formValues.additionalCompanies.map((company) => {
      if (company.isCurrentJob) {
        if (company.endDate !== null || company.isEndDateAuto) {
          changed = true
          return {
            ...company,
            endDate: null,
            isEndDateAuto: false,
          }
        }

        return company
      }

      const suggestedEndDate = resolveDefaultPreviousCompanyEndDate(
        company.startDate,
        formValues.startDate
      )

      if (!suggestedEndDate) {
        if (company.isEndDateAuto && company.endDate !== null) {
          changed = true
          return {
            ...company,
            endDate: null,
            isEndDateAuto: false,
          }
        }

        return company
      }

      if (
        company.endDate === null ||
        company.isEndDateAuto ||
        company.endDate.getTime() !== suggestedEndDate.getTime()
      ) {
        changed = true
        return {
          ...company,
          endDate: suggestedEndDate,
          isEndDateAuto: true,
        }
      }

      return company
    })

    if (changed) {
      form.setFieldValue("additionalCompanies", nextCompanies)
    }
  }, [form, formValues.additionalCompanies, formValues.startDate])

  async function validateCurrentStep() {
    const fields = STEP_FIELD_NAMES[step]

    await Promise.all(
      fields.map((name) =>
        form.validateField(name as Parameters<typeof form.validateField>[0], "submit")
      )
    )

    for (const name of fields) {
      form.setFieldMeta(name as Parameters<typeof form.setFieldMeta>[0], (prev) => ({
        ...prev,
        isTouched: true,
        isBlurred: true,
      }))
    }

    return onboardingStepSchemas[step].safeParse(form.state.values).success
  }

  async function handleNextStep() {
    const isValid = await validateCurrentStep()
    if (isValid) {
      setStep((currentStep) => Math.min(currentStep + 1, TOTAL_STEPS - 1))
    }
  }

  function handlePreviousStep() {
    setStep((currentStep) => Math.max(currentStep - 1, 0))
  }

  function handleResetCurrentStep() {
    const stepFields = STEP_FIELD_NAMES[step]
    const stepDefaults = Object.fromEntries(
      stepFields.map((fieldName) => [fieldName, onboardingDefaultValues[fieldName]])
    ) as Partial<OnboardingFormValues>

    form.reset({
      ...formValues,
      ...stepDefaults,
    })

    if (step === 0) {
      setCompanySearch("")
      setRoleSearch("")
    }
  }

  function addPrimaryCompanyEvent() {
    if (!formValues.startDate) {
      return
    }

    const nextEvent = buildOnboardingCompanyEventDraft({
      startDate: formValues.startDate,
      existingEvents: formValues.events,
    })

    form.setFieldValue("events", [...formValues.events, nextEvent])
  }

  function updatePrimaryCompanyEvent(
    eventId: string,
    updater: (event: OnboardingCompanyEventDraft) => OnboardingCompanyEventDraft
  ) {
    const nextEvents = formValues.events.map((event) =>
      event.id === eventId ? updater(event) : event
    )
    form.setFieldValue("events", nextEvents)
  }

  function removePrimaryCompanyEvent(eventId: string) {
    form.setFieldValue(
      "events",
      formValues.events.filter((event) => event.id !== eventId)
    )
  }

  function updateAdditionalCompany(
    companyId: string,
    updater: (company: OnboardingAdditionalCompanyDraft) => OnboardingAdditionalCompanyDraft
  ) {
    const nextCompanies = formValues.additionalCompanies.map((company) =>
      company.id === companyId ? updater(company) : company
    )

    form.setFieldValue("additionalCompanies", nextCompanies)
  }

  function removeAdditionalCompany(companyId: string) {
    form.setFieldValue(
      "additionalCompanies",
      formValues.additionalCompanies.filter((company) => company.id !== companyId)
    )
  }

  function cloneAdditionalCompany(company: OnboardingAdditionalCompanyDraft): OnboardingAdditionalCompanyDraft {
    return {
      ...company,
      startDate: company.startDate ? new Date(company.startDate) : null,
      endDate: company.endDate ? new Date(company.endDate) : null,
      events: company.events.map((event) => ({
        ...event,
        effectiveDate: event.effectiveDate ? new Date(event.effectiveDate) : null,
      })),
      workSchedule: company.workSchedule.map((day) => ({ ...day })),
    }
  }

  function openCreateAdditionalCompanyDialog() {
    const draft = buildOnboardingAdditionalCompanyDraft({
      currentCompanyStartDate: formValues.startDate,
      defaultWorkSchedule: formValues.defaultWorkSchedule,
      compensationType: formValues.compensationType,
      currency: formValues.currency,
    })

    setIsEditingAdditionalCompany(false)
    setAdditionalCompanyDraft(draft)
    setIsAdditionalCompanyDialogOpen(true)
  }

  function openEditAdditionalCompanyDialog(companyId: string) {
    const existing = formValues.additionalCompanies.find((company) => company.id === companyId)
    if (!existing) {
      return
    }

    setIsEditingAdditionalCompany(true)
    setAdditionalCompanyDraft(cloneAdditionalCompany(existing))
    setIsAdditionalCompanyDialogOpen(true)
  }

  function closeAdditionalCompanyDialog() {
    setIsAdditionalCompanyDialogOpen(false)
    setAdditionalCompanyDraft(null)
    setIsEditingAdditionalCompany(false)
  }

  function updateAdditionalCompanyDraftState(
    updater: (company: OnboardingAdditionalCompanyDraft) => OnboardingAdditionalCompanyDraft
  ) {
    setAdditionalCompanyDraft((currentDraft) => (currentDraft ? updater(currentDraft) : currentDraft))
  }

  function syncAdditionalCompanyDraftStartDate(
    currentCompany: OnboardingAdditionalCompanyDraft,
    nextStartDate: Date | null
  ): OnboardingAdditionalCompanyDraft {
    const normalizedStartDate = normalizeOnboardingCalendarDate(nextStartDate)
    const defaultEndDate = resolveDefaultPreviousCompanyEndDate(normalizedStartDate, formValues.startDate)

    if (currentCompany.isCurrentJob) {
      return {
        ...currentCompany,
        startDate: normalizedStartDate,
        endDate: null,
        isEndDateAuto: false,
      }
    }

    if (defaultEndDate && (currentCompany.endDate === null || currentCompany.isEndDateAuto)) {
      return {
        ...currentCompany,
        startDate: normalizedStartDate,
        endDate: defaultEndDate,
        isEndDateAuto: true,
      }
    }

    if (!defaultEndDate && currentCompany.isEndDateAuto) {
      return {
        ...currentCompany,
        startDate: normalizedStartDate,
        endDate: null,
        isEndDateAuto: false,
      }
    }

    return {
      ...currentCompany,
      startDate: normalizedStartDate,
    }
  }

  function addAdditionalCompanyDraftEvent() {
    if (!additionalCompanyDraft?.startDate) {
      return
    }

    updateAdditionalCompanyDraftState((currentCompany) => ({
      ...currentCompany,
      events: [
        ...currentCompany.events,
        buildOnboardingCompanyEventDraft({
          startDate: currentCompany.startDate,
          existingEvents: currentCompany.events,
        }),
      ],
    }))
  }

  function updateAdditionalCompanyDraftEvent(
    eventId: string,
    updater: (event: OnboardingCompanyEventDraft, company: OnboardingAdditionalCompanyDraft) => OnboardingCompanyEventDraft
  ) {
    updateAdditionalCompanyDraftState((currentCompany) => ({
      ...currentCompany,
      events: currentCompany.events.map((event) =>
        event.id === eventId ? updater(event, currentCompany) : event
      ),
    }))
  }

  function removeAdditionalCompanyDraftEvent(eventId: string) {
    updateAdditionalCompanyDraftState((currentCompany) => ({
      ...currentCompany,
      events: currentCompany.events.filter((event) => event.id !== eventId),
    }))
  }

  function handleAdditionalCompanyDialogSave() {
    if (!additionalCompanyDraft) {
      return
    }

    const validationResult = onboardingStep4Schema.safeParse({
      ...onboardingDefaultValues,
      additionalCompanies: [additionalCompanyDraft],
    })

    if (!validationResult.success) {
      const firstIssueMessage = validationResult.error.issues[0]?.message ?? dictionary.common.unknownError
      toast.error(firstIssueMessage)
      return
    }

    const hasExisting = formValues.additionalCompanies.some(
      (company) => company.id === additionalCompanyDraft.id
    )

    if (hasExisting) {
      updateAdditionalCompany(additionalCompanyDraft.id, () => additionalCompanyDraft)
    } else {
      form.setFieldValue("additionalCompanies", [
        ...formValues.additionalCompanies,
        additionalCompanyDraft,
      ])
    }

    closeAdditionalCompanyDialog()
  }

  async function handleSkipSummaryStep() {
    if (formValues.additionalCompanies.length > 0) {
      const confirmed = window.confirm(dictionary.onboarding.summary.skipConfirm)
      if (!confirmed) {
        return
      }

      form.setFieldValue("additionalCompanies", [])
      await form.handleSubmit()
      return
    }

    await form.handleSubmit()
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="absolute -top-24 left-[-72px] h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-96px] h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_84%_88%,rgba(255,255,255,0.12),transparent_30%)]" />

      <OnboardingWizardShell
        maxWidthClassName="max-w-[82rem]"
        containerClassName="flex min-h-screen items-center"
        outerPaddingClassName="px-4 py-8 sm:px-6 md:px-8"
        cardClassName="rounded-3xl border border-border/70 bg-card/95 text-card-foreground shadow-2xl backdrop-blur-sm"
      >
        <div className="border-b border-border p-6 pb-4 md:p-8 md:pb-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Capital Path</p>
            <p className="text-right text-xs text-muted-foreground">{dictionary.onboarding.completionHint}</p>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {dictionary.onboarding.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">{dictionary.onboarding.subtitle}</p>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{progressLabel}</span>
              <span>{step + 1}/{TOTAL_STEPS}</span>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(0, 1fr))` }}>
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <div
                  key={index}
                  className={cn("h-1.5 rounded-full bg-muted transition-colors", index <= step && "bg-primary")}
                />
              ))}
            </div>
          </div>
        </div>

        <form
          noValidate
          className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4"
          onSubmit={(eventSubmit) => {
            eventSubmit.preventDefault()
          }}
        >
          <TooltipProvider delayDuration={150}>
            <FieldGroup>
              {step === 0 ? (
                <>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {dictionary.onboarding.steps.companyRole}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.onboarding.descriptions.companyRole}
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <form.Field name="companyName">
                      {(field) => {
                        const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabelWithTooltip
                              htmlFor="onboarding-company"
                              label={dictionary.onboarding.fields.companyName}
                              tooltip={dictionary.onboarding.tooltips.companyName}
                            />
                            <Combobox
                              items={companyOptions}
                              value={field.state.value || null}
                              inputValue={field.state.value}
                              onInputValueChange={(value, eventDetails) => {
                                if (eventDetails.reason !== "input-change") {
                                  return
                                }

                                field.handleChange(value)
                                setCompanySearch(value)
                              }}
                              onValueChange={(value) => {
                                if (typeof value !== "string") {
                                  return
                                }

                                field.handleChange(value)
                                setCompanySearch(value)
                              }}
                            >
                              <ComboboxInput
                                id="onboarding-company"
                                name={field.name}
                                onBlur={field.handleBlur}
                                onKeyDown={(eventKeyDown) => {
                                  const expanded = eventKeyDown.currentTarget.getAttribute("aria-expanded") === "true"
                                  if (eventKeyDown.key === "Enter" && !expanded) {
                                    eventKeyDown.preventDefault()
                                  }
                                }}
                                aria-invalid={isInvalid}
                                placeholder={dictionary.onboarding.placeholders.companyName}
                                className="h-10 bg-background"
                              />
                              <ComboboxContent>
                                <ComboboxList>
                                  {(item) => (
                                    <ComboboxItem key={item} value={item}>
                                      {item}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                            {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                          </Field>
                        )
                      }}
                    </form.Field>

                    <form.Field name="roleName">
                      {(field) => {
                        const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabelWithTooltip
                              htmlFor="onboarding-role"
                              label={dictionary.onboarding.fields.roleName}
                              tooltip={dictionary.onboarding.tooltips.roleName}
                            />
                            <Combobox
                              items={roleOptions}
                              value={field.state.value || null}
                              inputValue={field.state.value}
                              onInputValueChange={(value, eventDetails) => {
                                if (eventDetails.reason !== "input-change") {
                                  return
                                }

                                field.handleChange(value)
                                setRoleSearch(value)
                              }}
                              onValueChange={(value) => {
                                if (typeof value !== "string") {
                                  return
                                }

                                field.handleChange(value)
                                setRoleSearch(value)
                              }}
                            >
                              <ComboboxInput
                                id="onboarding-role"
                                name={field.name}
                                onBlur={field.handleBlur}
                                onKeyDown={(eventKeyDown) => {
                                  const expanded = eventKeyDown.currentTarget.getAttribute("aria-expanded") === "true"
                                  if (eventKeyDown.key === "Enter" && !expanded) {
                                    eventKeyDown.preventDefault()
                                  }
                                }}
                                aria-invalid={isInvalid}
                                placeholder={dictionary.onboarding.placeholders.roleName}
                                className="h-10 bg-background"
                              />
                              <ComboboxContent>
                                <ComboboxList>
                                  {(item) => (
                                    <ComboboxItem key={item} value={item}>
                                      {item}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                            {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                          </Field>
                        )
                      }}
                    </form.Field>
                  </div>

                  <form.Field name="startDate">
                    {(field) => {
                      const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabelWithTooltip
                            htmlFor="onboarding-start-date"
                            label={dictionary.onboarding.fields.startDate}
                            tooltip={dictionary.onboarding.tooltips.startDate}
                          />
                          <SingleDatePickerField
                            id="onboarding-start-date"
                            value={field.state.value}
                            onChange={(nextDate) => field.handleChange(normalizeOnboardingCalendarDate(nextDate))}
                            onBlur={field.handleBlur}
                            ariaInvalid={isInvalid}
                            placeholder={dictionary.onboarding.placeholders.startDate}
                          />
                          {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                        </Field>
                      )
                    }}
                  </form.Field>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {dictionary.onboarding.steps.compensationAndEvents}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.onboarding.descriptions.compensationAndEvents}
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <form.Field name="compensationType">
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabelWithTooltip
                              htmlFor="onboarding-compensation-type"
                              label={dictionary.onboarding.fields.compensationType}
                              tooltip={dictionary.onboarding.tooltips.compensationType}
                            />
                            <Select
                              name={field.name}
                              value={field.state.value}
                              onValueChange={(value) => {
                                if (!isCompensationType(value)) {
                                  return
                                }

                                field.handleChange(value)
                              }}
                            >
                              <SelectTrigger
                                id="onboarding-compensation-type"
                                aria-invalid={isInvalid}
                                className="w-full bg-background"
                              >
                                <SelectValue placeholder={dictionary.onboarding.fields.compensationType} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={CompensationType.HOURLY}>
                                  {dictionary.onboarding.options.compensationHourly}
                                </SelectItem>
                                <SelectItem value={CompensationType.MONTHLY}>
                                  {dictionary.onboarding.options.compensationMonthly}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                          </Field>
                        )
                      }}
                    </form.Field>

                    <form.Field name="currency">
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabelWithTooltip
                              htmlFor="onboarding-currency"
                              label={dictionary.onboarding.fields.currency}
                              tooltip={dictionary.onboarding.tooltips.currency}
                            />
                            <Combobox
                              items={currencyOptions}
                              value={field.state.value || null}
                              inputValue={field.state.value}
                              onInputValueChange={(value, eventDetails) => {
                                if (eventDetails.reason !== "input-change") {
                                  return
                                }

                                field.handleChange(value.toUpperCase())
                              }}
                              onValueChange={(value) => {
                                if (typeof value !== "string") {
                                  return
                                }

                                field.handleChange(value)
                              }}
                            >
                              <ComboboxInput
                                id="onboarding-currency"
                                name={field.name}
                                onBlur={field.handleBlur}
                                onKeyDown={(eventKeyDown) => {
                                  const expanded = eventKeyDown.currentTarget.getAttribute("aria-expanded") === "true"
                                  if (eventKeyDown.key === "Enter" && !expanded) {
                                    eventKeyDown.preventDefault()
                                  }
                                }}
                                aria-invalid={isInvalid}
                                placeholder={dictionary.onboarding.placeholders.selectCurrency}
                                className="h-8 w-full bg-background"
                              />
                              <ComboboxContent>
                                <ComboboxList>
                                  {(currency) => (
                                    <ComboboxItem key={currency} value={currency}>
                                      {currency}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                            {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                          </Field>
                        )
                      }}
                    </form.Field>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold">{dictionary.onboarding.events.title}</p>
                          <HelpTooltip text={dictionary.onboarding.tooltips.eventEffectiveDate} />
                        </div>
                        <p className="text-xs text-muted-foreground">{dictionary.onboarding.events.description}</p>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        className="w-full font-semibold sm:w-auto"
                        onClick={addPrimaryCompanyEvent}
                        disabled={!formValues.startDate || isShowingCompletionAnimation}
                      >
                        <PlusIcon className="size-4" />
                        {dictionary.onboarding.events.addEvent}
                      </Button>
                    </div>

                    <div className="mt-3 rounded-xl border border-border/60 bg-background/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {dictionary.onboarding.events.typeGuidanceTitle}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>{dictionary.onboarding.events.typeGuidanceRateIncrease}</p>
                        <p>{dictionary.onboarding.events.typeGuidancePromotion}</p>
                        <p>{dictionary.onboarding.events.typeGuidanceAnnual}</p>
                        <p>{dictionary.onboarding.events.typeGuidanceMidYear}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {dictionary.onboarding.events.startEvent}
                      </p>
                      <div className="mt-2 grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">{dictionary.onboarding.events.changeTypeLabel}</p>
                          <p className="text-sm font-medium">
                            {eventTypeLabels[PathCompanyEventType.START_RATE]}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{dictionary.onboarding.events.effectiveDateLabel}</p>
                          <p className="text-sm font-medium">
                            {formValues.startDate ? dateFormatter.format(formValues.startDate) : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{dictionary.onboarding.events.amountLabel}</p>
                          <form.Field name="startRate">
                            {(field) => {
                              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

                              return (
                                <Field data-invalid={isInvalid}>
                                  <NumberStepperInput
                                    id="onboarding-start-rate-card"
                                    name={field.name}
                                    value={field.state.value}
                                    className="mt-1 h-8 w-full bg-background"
                                    min={0}
                                    step={compensationRateStep}
                                    onBlur={field.handleBlur}
                                    ariaInvalid={isInvalid}
                                    onChange={field.handleChange}
                                  />
                                  {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                                </Field>
                              )
                            }}
                          </form.Field>
                        </div>
                      </div>
                    </div>

                    {formValues.events.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {formValues.events.map((event, index) => {
                          const stepValue = getCompensationRateStep(
                            formValues.compensationType,
                            formValues.currency
                          )

                          return (
                            <div key={event.id} className="rounded-xl border border-border/60 bg-background/80 p-3">
                              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                                <div>
                                  <p className="mb-1 text-xs text-muted-foreground">{dictionary.onboarding.events.changeTypeLabel}</p>
                                  <Select
                                    value={event.eventType}
                                    onValueChange={(value) => {
                                      if (!isOnboardingEventType(value)) {
                                        return
                                      }

                                      updatePrimaryCompanyEvent(event.id, (currentEvent) => ({
                                        ...currentEvent,
                                        eventType: value,
                                        effectiveDate: formValues.startDate
                                          ? resolveDefaultEventDate({
                                            eventType: value,
                                            startDate: formValues.startDate,
                                            existingEvents: formValues.events.filter(
                                              (item) => item.id !== currentEvent.id
                                            ),
                                          })
                                          : currentEvent.effectiveDate,
                                      }))
                                    }}
                                  >
                                    <SelectTrigger className="h-8 w-full bg-background">
                                      <SelectValue placeholder={dictionary.onboarding.events.selectTypePlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {onboardingEventTypeOptions.map((eventType) => (
                                        <SelectItem key={eventType} value={eventType}>
                                          {eventTypeLabels[eventType]}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <p className="mb-1 text-xs text-muted-foreground">{dictionary.onboarding.events.effectiveDateLabel}</p>
                                  <SingleDatePickerField
                                    id={`onboarding-event-date-${event.id}`}
                                    value={event.effectiveDate}
                                    onChange={(nextDate) => {
                                      updatePrimaryCompanyEvent(event.id, (currentEvent) => ({
                                        ...currentEvent,
                                        effectiveDate: normalizeOnboardingCalendarDate(nextDate),
                                      }))
                                    }}
                                    placeholder={dictionary.onboarding.placeholders.pickDate}
                                    triggerClassName="h-8 w-full"
                                  />
                                </div>

                                <div>
                                  <p className="mb-1 text-xs text-muted-foreground">{dictionary.onboarding.events.amountLabel}</p>
                                  <NumberStepperInput
                                    id={`onboarding-event-amount-${event.id}`}
                                    name={`onboarding-event-amount-${index}`}
                                    value={event.amount}
                                    className="h-8 w-full bg-background"
                                    min={0}
                                    step={stepValue}
                                    onChange={(nextValue) => {
                                      updatePrimaryCompanyEvent(event.id, (currentEvent) => ({
                                        ...currentEvent,
                                        amount: nextValue,
                                      }))
                                    }}
                                  />
                                </div>

                                <div className="flex items-end justify-end">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => removePrimaryCompanyEvent(event.id)}
                                  >
                                    <Trash2Icon className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {dictionary.onboarding.events.empty}
                      </p>
                    )}
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {dictionary.onboarding.steps.workSettings}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.onboarding.descriptions.workSettingsCurrent}
                  </p>
                  <form.Field name="defaultWorkSchedule">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

                      return (
                        <Field data-invalid={isInvalid}>
                          <WorkScheduleEditor
                            value={field.state.value}
                            onChange={field.handleChange}
                            showDescription={false}
                            showBreakMinute={formValues.compensationType === "hourly"}
                            disabled={isShowingCompletionAnimation}
                            helpText={{
                              weeklySchedule: dictionary.onboarding.tooltips.weeklySchedule,
                              quickEdit: dictionary.onboarding.tooltips.quickEdit,
                              dayStatus: dictionary.onboarding.tooltips.dayStatus,
                              from: dictionary.onboarding.tooltips.fromTime,
                              to: dictionary.onboarding.tooltips.toTime,
                              breakDuration: dictionary.onboarding.tooltips.breakDuration,
                            }}
                          />
                          {isUsingDefaultWorkSchedule ? (
                            <FieldDescription>{dictionary.onboarding.hints.workSettings}</FieldDescription>
                          ) : null}
                          {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                        </Field>
                      )
                    }}
                  </form.Field>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {dictionary.onboarding.steps.summary}
                  </h2>
                  <p className="text-sm text-muted-foreground">{dictionary.onboarding.descriptions.summary}</p>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                      <p className="text-sm font-semibold">{dictionary.onboarding.summary.currentCompany}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formValues.companyName || dictionary.profile.notAvailable} · {formValues.roleName || dictionary.profile.notAvailable}
                      </p>

                      <div className="mt-4 space-y-2">
                        {currentCompanyTimeline.map((event) => (
                          <div
                            key={event.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium">{eventTypeLabels[event.eventType] ?? event.eventType}</p>
                              <p className="text-xs text-muted-foreground">{dateFormatter.format(event.effectiveDate)}</p>
                            </div>
                            <p className="text-sm font-semibold">
                              {formatAmount(locale, formValues.currency, event.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{dictionary.profile.workSettings.weeklyScheduleLabel}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsCurrentScheduleDialogOpen(true)}>
                          {dictionary.companies.actions.editWorkSchedule}
                        </Button>
                      </div>
                      <div className="mt-3">
                        <WorkScheduleSummary
                          schedule={formValues.defaultWorkSchedule}
                          showBreakMinute={formValues.compensationType === "hourly"}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
                    <p className="text-sm font-semibold">{dictionary.onboarding.summary.precisionTitle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dictionary.onboarding.summary.precisionDescription}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{dictionary.onboarding.summary.additionalCompaniesTitle}</p>
                        <p className="text-xs text-muted-foreground">{dictionary.onboarding.summary.additionalCompaniesDescription}</p>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        className="w-full font-semibold sm:w-auto"
                        onClick={openCreateAdditionalCompanyDialog}
                      >
                        <PlusIcon className="size-4" />
                        {dictionary.onboarding.summary.addCompany}
                      </Button>
                    </div>

                    {formValues.additionalCompanies.length > 0 ? (
                      <div className="mt-4 space-y-4">
                        {formValues.additionalCompanies.map((company, index) => {
                          const timeline = buildAdditionalCompanyTimeline(company)
                          const endLabel = company.isCurrentJob || !company.endDate
                            ? dictionary.onboarding.summary.activeCompany
                            : dateFormatter.format(company.endDate)

                          return (
                            <article key={company.id} className="rounded-xl border border-border/70 bg-background/85 p-4">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {dictionary.onboarding.summary.companyLabel.replace("{index}", String(index + 1))}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {company.companyName || dictionary.profile.notAvailable} ·{" "}
                                    {company.roleName || dictionary.profile.notAvailable}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditAdditionalCompanyDialog(company.id)}
                                  >
                                    <PencilIcon className="size-4" />
                                    {dictionary.onboarding.summary.editCompany}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeAdditionalCompany(company.id)}
                                  >
                                    <Trash2Icon className="size-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-3 md:grid-cols-4">
                                <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                                  <p className="text-xs text-muted-foreground">{dictionary.onboarding.fields.startDate}</p>
                                  <p className="text-sm font-medium">
                                    {company.startDate ? dateFormatter.format(company.startDate) : "-"}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                                  <p className="text-xs text-muted-foreground">{dictionary.companies.labels.endDate}</p>
                                  <p className="text-sm font-medium">{endLabel}</p>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                                  <p className="text-xs text-muted-foreground">{dictionary.onboarding.fields.compensationType}</p>
                                  <p className="text-sm font-medium">
                                    {company.compensationType === CompensationType.HOURLY
                                      ? dictionary.onboarding.options.compensationHourly
                                      : dictionary.onboarding.options.compensationMonthly}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                                  <p className="text-xs text-muted-foreground">{dictionary.onboarding.fields.startRate}</p>
                                  <p className="text-sm font-medium">
                                    {formatAmount(locale, company.currency, company.startRate)}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 rounded-lg border border-border/60 bg-background/80 p-3">
                                <p className="text-sm font-semibold">{dictionary.profile.workSettings.weeklyScheduleLabel}</p>
                                <div className="mt-2">
                                  <WorkScheduleSummary
                                    schedule={company.workSchedule}
                                    showBreakMinute={company.compensationType === "hourly"}
                                  />
                                </div>
                              </div>

                              <div className="mt-4 rounded-lg border border-border/60 bg-background/80 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  {dictionary.onboarding.summary.eventsOrderedLabel}
                                </p>
                                <div className="mt-2 space-y-2">
                                  {timeline.map((timelineEvent) => (
                                    <div
                                      key={timelineEvent.id}
                                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-background px-2.5 py-2"
                                    >
                                      <div>
                                        <p className="text-sm font-medium">
                                          {eventTypeLabels[timelineEvent.eventType] ?? timelineEvent.eventType}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {dateFormatter.format(timelineEvent.effectiveDate)}
                                        </p>
                                      </div>
                                      <p className="text-sm font-semibold">
                                        {formatAmount(locale, company.currency, timelineEvent.amount)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">{dictionary.onboarding.summary.noAdditionalCompanies}</p>
                    )}
                  </div>
                </>
              ) : null}
            </FieldGroup>
          </TooltipProvider>

          <div className="mt-8 grid grid-cols-[1fr_auto] items-end gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isShowingCompletionAnimation}
                onClick={handleResetCurrentStep}
              >
                {dictionary.onboarding.actions.resetStep}
              </Button>
              <Button
                type="button"
                className="hidden md:inline-flex"
                variant="outline"
                disabled={isShowingCompletionAnimation}
                onClick={() => {
                  form.reset()
                  setCompanySearch("")
                  setRoleSearch("")
                  setStep(0)
                }}
              >
                {dictionary.onboarding.actions.reset}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isShowingCompletionAnimation}
                  onClick={handlePreviousStep}
                >
                  {dictionary.onboarding.actions.previous}
                </Button>
              ) : null}

              {step < TOTAL_STEPS - 1 ? (
                <Button
                  type="button"
                  className="hover:bg-primary/90"
                  disabled={isShowingCompletionAnimation}
                  onClick={() => void handleNextStep()}
                >
                  {dictionary.onboarding.actions.next}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleSkipSummaryStep()}
                    disabled={completeOnboardingMutation.isLoading || isShowingCompletionAnimation}
                  >
                    {dictionary.onboarding.actions.skipSummary}
                  </Button>
                  <Button
                    type="button"
                    className="hover:bg-primary/90"
                    onClick={() => void form.handleSubmit()}
                    disabled={completeOnboardingMutation.isLoading || isShowingCompletionAnimation}
                  >
                    {completeOnboardingMutation.isLoading
                      ? dictionary.onboarding.actions.complete
                      : dictionary.onboarding.actions.submit}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </OnboardingWizardShell>

      <Dialog open={isCurrentScheduleDialogOpen} onOpenChange={setIsCurrentScheduleDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-none sm:w-[min(98vw,1360px)]">
          <DialogHeader>
            <DialogTitle>{dictionary.companies.dialogs.editWorkScheduleTitle}</DialogTitle>
            <DialogDescription>{dictionary.companies.dialogs.editWorkScheduleDescription}</DialogDescription>
          </DialogHeader>

          <WorkScheduleEditor
            value={formValues.defaultWorkSchedule}
            onChange={(nextSchedule) => form.setFieldValue("defaultWorkSchedule", nextSchedule)}
            showDescription={false}
            showBreakMinute={formValues.compensationType === "hourly"}
            disabled={isShowingCompletionAnimation}
          />

          <DialogFooter>
            <Button type="button" onClick={() => setIsCurrentScheduleDialogOpen(false)}>
              {dictionary.companies.actions.saveWorkSchedule}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAdditionalCompanyDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeAdditionalCompanyDialog()
          } else {
            setIsAdditionalCompanyDialogOpen(true)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-none sm:w-[min(98vw,1360px)]">
          <DialogHeader>
            <DialogTitle>
              {isEditingAdditionalCompany
                ? dictionary.onboarding.summary.editCompanyDialogTitle
                : dictionary.onboarding.summary.addCompanyDialogTitle}
            </DialogTitle>
            <DialogDescription>{dictionary.onboarding.summary.addCompanyDialogDescription}</DialogDescription>
          </DialogHeader>

          {additionalCompanyDraft ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field>
                  <FieldLabel>{dictionary.onboarding.fields.companyName}</FieldLabel>
                  <Input
                    value={additionalCompanyDraft.companyName}
                    onChange={(eventChange) => {
                      updateAdditionalCompanyDraftState((currentCompany) => ({
                        ...currentCompany,
                        companyName: eventChange.target.value,
                      }))
                    }}
                    placeholder={dictionary.onboarding.placeholders.companyName}
                  />
                </Field>

                <Field>
                  <FieldLabel>{dictionary.onboarding.fields.roleName}</FieldLabel>
                  <Input
                    value={additionalCompanyDraft.roleName}
                    onChange={(eventChange) => {
                      updateAdditionalCompanyDraftState((currentCompany) => ({
                        ...currentCompany,
                        roleName: eventChange.target.value,
                      }))
                    }}
                    placeholder={dictionary.onboarding.placeholders.roleName}
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field>
                  <FieldLabel>{dictionary.onboarding.fields.startDate}</FieldLabel>
                  <SingleDatePickerField
                    id={`additional-company-dialog-start-${additionalCompanyDraft.id}`}
                    value={additionalCompanyDraft.startDate}
                    onChange={(nextStartDate) => {
                      updateAdditionalCompanyDraftState((currentCompany) =>
                        syncAdditionalCompanyDraftStartDate(currentCompany, nextStartDate)
                      )
                    }}
                    placeholder={dictionary.onboarding.placeholders.startDate}
                    triggerClassName="h-8 w-full"
                  />
                </Field>

                <Field>
                  <FieldLabel>{dictionary.companies.labels.endDate}</FieldLabel>
                  <SingleDatePickerField
                    id={`additional-company-dialog-end-${additionalCompanyDraft.id}`}
                    value={additionalCompanyDraft.endDate}
                    onChange={(nextEndDate) => {
                      updateAdditionalCompanyDraftState((currentCompany) => ({
                        ...currentCompany,
                        isCurrentJob: nextEndDate === null,
                        endDate: normalizeOnboardingCalendarDate(nextEndDate),
                        isEndDateAuto: false,
                      }))
                    }}
                    placeholder={dictionary.companies.placeholders.endDate}
                    disabled={additionalCompanyDraft.isCurrentJob}
                    triggerClassName="h-8 w-full"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant={additionalCompanyDraft.isCurrentJob ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        updateAdditionalCompanyDraftState((currentCompany) => ({
                          ...currentCompany,
                          isCurrentJob: !currentCompany.isCurrentJob,
                          endDate: !currentCompany.isCurrentJob
                            ? null
                            : resolveDefaultPreviousCompanyEndDate(
                              currentCompany.startDate,
                              formValues.startDate
                            ),
                          isEndDateAuto: currentCompany.isCurrentJob
                            ? resolveDefaultPreviousCompanyEndDate(
                              currentCompany.startDate,
                              formValues.startDate
                            ) !== null
                            : false,
                        }))
                      }}
                    >
                      {dictionary.onboarding.summary.keepCurrentJob}
                    </Button>
                  </div>
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field>
                  <FieldLabel>{dictionary.onboarding.fields.compensationType}</FieldLabel>
                  <Select
                    value={additionalCompanyDraft.compensationType}
                    onValueChange={(value) => {
                      if (!isCompensationType(value)) {
                        return
                      }

                      updateAdditionalCompanyDraftState((currentCompany) => ({
                        ...currentCompany,
                        compensationType: value,
                      }))
                    }}
                  >
                    <SelectTrigger className="h-8 w-full bg-background">
                      <SelectValue placeholder={dictionary.onboarding.fields.compensationType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CompensationType.HOURLY}>
                        {dictionary.onboarding.options.compensationHourly}
                      </SelectItem>
                      <SelectItem value={CompensationType.MONTHLY}>
                        {dictionary.onboarding.options.compensationMonthly}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>{dictionary.onboarding.fields.currency}</FieldLabel>
                  <Combobox
                    items={currencyOptions}
                    value={additionalCompanyDraft.currency || null}
                    inputValue={additionalCompanyDraft.currency}
                    onInputValueChange={(value, eventDetails) => {
                      if (eventDetails.reason !== "input-change") {
                        return
                      }

                      updateAdditionalCompanyDraftState((currentCompany) => ({
                        ...currentCompany,
                        currency: value.toUpperCase(),
                      }))
                    }}
                    onValueChange={(value) => {
                      if (typeof value !== "string") {
                        return
                      }

                      updateAdditionalCompanyDraftState((currentCompany) => ({
                        ...currentCompany,
                        currency: value,
                      }))
                    }}
                  >
                    <ComboboxInput
                      placeholder={dictionary.onboarding.placeholders.selectCurrency}
                      className="h-8 w-full bg-background"
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {(currency) => (
                          <ComboboxItem key={currency} value={currency}>
                            {currency}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>
              </div>

              <Field>
                <FieldLabel>{dictionary.onboarding.fields.startRate}</FieldLabel>
                <NumberStepperInput
                  id={`additional-company-dialog-rate-${additionalCompanyDraft.id}`}
                  name={`additional-company-dialog-rate-${additionalCompanyDraft.id}`}
                  value={additionalCompanyDraft.startRate}
                  className="h-8 w-full bg-background"
                  min={0}
                  step={getCompensationRateStep(
                    additionalCompanyDraft.compensationType,
                    additionalCompanyDraft.currency
                  )}
                  onChange={(nextRate) => {
                    updateAdditionalCompanyDraftState((currentCompany) => ({
                      ...currentCompany,
                      startRate: nextRate,
                    }))
                  }}
                />
              </Field>

              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold">{dictionary.onboarding.events.title}</p>
                    <HelpTooltip text={dictionary.onboarding.tooltips.eventEffectiveDate} />
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    className="w-full font-semibold sm:w-auto"
                    onClick={addAdditionalCompanyDraftEvent}
                    disabled={!additionalCompanyDraft.startDate}
                  >
                    <PlusIcon className="size-4" />
                    {dictionary.onboarding.events.addEvent}
                  </Button>
                </div>

                <div className="mt-3 rounded-lg border border-border/50 bg-background p-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {dictionary.onboarding.events.startEvent}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {additionalCompanyDraft.startDate
                      ? `${dateFormatter.format(additionalCompanyDraft.startDate)} · ${formatAmount(
                        locale,
                        additionalCompanyDraft.currency,
                        additionalCompanyDraft.startRate
                      )}`
                      : dictionary.onboarding.events.setStartDateFirst}
                  </p>
                </div>

                {additionalCompanyDraft.events.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {additionalCompanyDraft.events.map((event, eventIndex) => (
                      <div key={event.id} className="rounded-lg border border-border/50 bg-background p-3">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                          <div>
                            <p className="mb-1 text-xs text-muted-foreground">{dictionary.onboarding.events.changeTypeLabel}</p>
                            <Select
                              value={event.eventType}
                              onValueChange={(value) => {
                                if (!isOnboardingEventType(value)) {
                                  return
                                }

                                updateAdditionalCompanyDraftEvent(event.id, (currentEvent, currentCompany) => ({
                                  ...currentEvent,
                                  eventType: value,
                                  effectiveDate: currentCompany.startDate
                                    ? resolveDefaultEventDate({
                                      eventType: value,
                                      startDate: currentCompany.startDate,
                                      existingEvents: currentCompany.events.filter(
                                        (candidate) => candidate.id !== currentEvent.id
                                      ),
                                    })
                                    : currentEvent.effectiveDate,
                                }))
                              }}
                            >
                              <SelectTrigger className="h-8 w-full bg-background">
                                <SelectValue placeholder={dictionary.onboarding.events.selectTypePlaceholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {onboardingEventTypeOptions.map((eventType) => (
                                  <SelectItem key={eventType} value={eventType}>
                                    {eventTypeLabels[eventType]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <p className="mb-1 text-xs text-muted-foreground">{dictionary.onboarding.events.effectiveDateLabel}</p>
                            <SingleDatePickerField
                              id={`additional-company-dialog-event-date-${additionalCompanyDraft.id}-${event.id}`}
                              value={event.effectiveDate}
                              onChange={(nextDate) => {
                                updateAdditionalCompanyDraftEvent(event.id, (currentEvent) => ({
                                  ...currentEvent,
                                  effectiveDate: normalizeOnboardingCalendarDate(nextDate),
                                }))
                              }}
                              placeholder={dictionary.onboarding.placeholders.pickDate}
                              triggerClassName="h-8 w-full"
                            />
                          </div>

                          <div>
                            <p className="mb-1 text-xs text-muted-foreground">{dictionary.onboarding.events.amountLabel}</p>
                            <NumberStepperInput
                              id={`additional-company-dialog-event-amount-${additionalCompanyDraft.id}-${event.id}`}
                              name={`additional-company-dialog-event-amount-${additionalCompanyDraft.id}-${eventIndex}`}
                              value={event.amount}
                              className="h-8 w-full bg-background"
                              min={0}
                              step={getCompensationRateStep(
                                additionalCompanyDraft.compensationType,
                                additionalCompanyDraft.currency
                              )}
                              onChange={(nextAmount) => {
                                updateAdditionalCompanyDraftEvent(event.id, (currentEvent) => ({
                                  ...currentEvent,
                                  amount: nextAmount,
                                }))
                              }}
                            />
                          </div>

                          <div className="flex items-end justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => removeAdditionalCompanyDraftEvent(event.id)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">{dictionary.onboarding.events.empty}</p>
                )}
              </div>

              <Field>
                <FieldLabel>{dictionary.profile.workSettings.weeklyScheduleLabel}</FieldLabel>
                <WorkScheduleEditor
                  value={additionalCompanyDraft.workSchedule}
                  onChange={(nextSchedule) => {
                    updateAdditionalCompanyDraftState((currentCompany) => ({
                      ...currentCompany,
                      workSchedule: nextSchedule,
                    }))
                  }}
                  showDescription={false}
                  showBreakMinute={additionalCompanyDraft.compensationType === "hourly"}
                  disabled={isShowingCompletionAnimation}
                  helpText={{
                    weeklySchedule: dictionary.onboarding.tooltips.weeklySchedule,
                    quickEdit: dictionary.onboarding.tooltips.quickEdit,
                    dayStatus: dictionary.onboarding.tooltips.dayStatus,
                    from: dictionary.onboarding.tooltips.fromTime,
                    to: dictionary.onboarding.tooltips.toTime,
                    breakDuration: dictionary.onboarding.tooltips.breakDuration,
                  }}
                />
              </Field>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAdditionalCompanyDialog}>
              {dictionary.companies.actions.cancel}
            </Button>
            <Button type="button" onClick={handleAdditionalCompanyDialogSave}>
              {isEditingAdditionalCompany
                ? dictionary.onboarding.summary.saveCompanyChanges
                : dictionary.onboarding.summary.confirmAddCompany}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isShowingCompletionAnimation ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4 backdrop-blur-sm">
          <div
            role="status"
            aria-live="polite"
            className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center text-card-foreground shadow-xl"
          >
            <div className="mx-auto size-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="mt-5 text-lg font-semibold tracking-tight">
              {dictionary.onboarding.completionAnimation.title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {dictionary.onboarding.completionAnimation.description}
            </p>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary/40" />
              <span className="size-1.5 rounded-full bg-primary/60" />
              <span className="size-1.5 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
