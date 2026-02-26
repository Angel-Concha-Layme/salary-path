"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useStore } from "@tanstack/react-store"
import { InfoIcon } from "lucide-react"
import { toast } from "sonner"

import { useCompanyCatalogListQuery } from "@/app/hooks/companies/use-company-catalog"
import { useRoleCatalogListQuery } from "@/app/hooks/roles/use-role-catalog"
import { useCompleteOnboardingMutation } from "@/app/hooks/onboarding/use-onboarding"
import {
  CompensationType,
  isCompensationType,
} from "@/app/lib/models/common/domain-enums"
import {
  currencyOptions,
  getCompensationRateStep,
  onboardingDefaultValues,
  onboardingFormSchema,
  onboardingStepSchemas,
  type OnboardingFormValues,
} from "@/app/lib/models/onboarding/onboarding-form.model"
import {
  normalizeWorkSchedule,
  type WorkSchedule,
} from "@/app/lib/models/work-schedule/work-schedule.model"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { SingleDatePickerField } from "@/components/shared/single-date-picker-field"
import { NumberStepperInput } from "@/components/onboarding/number-stepper-input"
import { OnboardingWizardShell } from "@/components/onboarding/onboarding-wizard-shell"
import { WorkScheduleEditor } from "@/components/work-schedule-editor"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const TOTAL_STEPS = 3
const COMPLETION_ANIMATION_DURATION_MS = 1500
const DEFAULT_WORK_SCHEDULE = normalizeWorkSchedule(onboardingDefaultValues.defaultWorkSchedule)

const STEP_FIELD_NAMES: Array<Array<keyof OnboardingFormValues>> = [
  ["companyName", "roleName", "startDate"],
  ["compensationType", "currency", "initialRate", "currentRate"],
  ["defaultWorkSchedule"],
]

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

export function OnboardingWizard() {
  const router = useRouter()
  const { dictionary, locale } = useDictionary()
  const completeOnboardingMutation = useCompleteOnboardingMutation()
  const [step, setStep] = useState(0)
  const [companySearch, setCompanySearch] = useState("")
  const [roleSearch, setRoleSearch] = useState("")
  const [isShowingCompletionAnimation, setIsShowingCompletionAnimation] = useState(false)

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
      if (!value.startDate) return

      const submitStartedAt = Date.now()
      setIsShowingCompletionAnimation(true)

      try {
        await completeOnboardingMutation.mutateAsync({
          companyName: value.companyName.trim(),
          roleName: value.roleName.trim(),
          startDate: value.startDate.toISOString(),
          endDate: null,
          compensationType: value.compensationType,
          currency: value.currency,
          initialRate: value.initialRate,
          currentRate: value.currentRate,
          defaultWorkSchedule: value.defaultWorkSchedule,
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

  const selectedCompensationType = useStore(form.store, (state) => state.values.compensationType)
  const selectedCurrency = useStore(form.store, (state) => state.values.currency)
  const selectedWorkSchedule = useStore(form.store, (state) => state.values.defaultWorkSchedule)

  const isUsingDefaultWorkSchedule = useMemo(
    () =>
      areWorkSchedulesEqual(
        normalizeWorkSchedule(selectedWorkSchedule),
        DEFAULT_WORK_SCHEDULE
      ),
    [selectedWorkSchedule]
  )

  const companyOptions = useMemo(() => {
    const catalogNames = (companyCatalogQuery.data?.items ?? []).map((c) => c.name)
    const current = form.state.values.companyName
    return current ? Array.from(new Set([current, ...catalogNames])) : catalogNames
  }, [companyCatalogQuery.data?.items, form.state.values.companyName])

  const roleOptions = useMemo(() => {
    const catalogNames = (roleCatalogQuery.data?.items ?? []).map((r) => r.name)
    const current = form.state.values.roleName
    return current ? Array.from(new Set([current, ...catalogNames])) : catalogNames
  }, [roleCatalogQuery.data?.items, form.state.values.roleName])

  async function validateCurrentStep() {
    const fields = STEP_FIELD_NAMES[step]

    await Promise.all(
      fields.map((name) => form.validateField(name as Parameters<typeof form.validateField>[0], "submit")),
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
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
    }
  }

  function handlePreviousStep() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function handleResetCurrentStep() {
    const stepFields = STEP_FIELD_NAMES[step]
    const stepDefaults = Object.fromEntries(
      stepFields.map((fieldName) => [fieldName, onboardingDefaultValues[fieldName]])
    ) as Partial<OnboardingFormValues>

    form.reset({
      ...form.state.values,
      ...stepDefaults,
    })

    if (step === 0) {
      setCompanySearch("")
      setRoleSearch("")
    }

  }

  const progressLabel = dictionary.onboarding.stepProgress
    .replace("{current}", String(step + 1))
    .replace("{total}", String(TOTAL_STEPS))

  const compensationRateStep = getCompensationRateStep(
    selectedCompensationType,
    selectedCurrency
  )

  return (
    <section className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="absolute -top-24 left-[-72px] h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-96px] h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_84%_88%,rgba(255,255,255,0.12),transparent_30%)]" />

      <OnboardingWizardShell
        maxWidthClassName="max-w-[80rem]"
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
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={cn("h-1.5 rounded-full bg-muted transition-colors", i <= step && "bg-primary")}
                  />
                ))}
              </div>
            </div>
          </div>

          <form
            noValidate
            className="px-6 pb-6 pt-3 md:px-8 md:pb-8 md:pt-4"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <TooltipProvider delayDuration={150}>
              <FieldGroup>
              {step === 0 && (
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
                                onKeyDown={(event) => {
                                  const expanded = event.currentTarget.getAttribute("aria-expanded") === "true"
                                  if (event.key === "Enter" && !expanded) {
                                    event.preventDefault()
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
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                                onKeyDown={(event) => {
                                  const expanded = event.currentTarget.getAttribute("aria-expanded") === "true"
                                  if (event.key === "Enter" && !expanded) {
                                    event.preventDefault()
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
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                            onChange={field.handleChange}
                            onBlur={field.handleBlur}
                            ariaInvalid={isInvalid}
                            placeholder={dictionary.onboarding.placeholders.startDate}
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      )
                    }}
                  </form.Field>
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {dictionary.onboarding.steps.compensation}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.onboarding.descriptions.compensation}
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
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                                onKeyDown={(event) => {
                                  const expanded = event.currentTarget.getAttribute("aria-expanded") === "true"
                                  if (event.key === "Enter" && !expanded) {
                                    event.preventDefault()
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
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        )
                      }}
                    </form.Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <form.Field name="initialRate">
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabelWithTooltip
                              htmlFor="onboarding-initial-rate"
                              label={dictionary.onboarding.fields.initialRate}
                              tooltip={dictionary.onboarding.tooltips.initialRate}
                            />
                            <NumberStepperInput
                              id="onboarding-initial-rate"
                              name={field.name}
                              value={field.state.value}
                              className="bg-background"
                              min={0}
                              step={compensationRateStep}
                              onBlur={field.handleBlur}
                              ariaInvalid={isInvalid}
                              onChange={field.handleChange}
                            />
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        )
                      }}
                    </form.Field>

                    <form.Field name="currentRate">
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabelWithTooltip
                              htmlFor="onboarding-current-rate"
                              label={dictionary.onboarding.fields.currentRate}
                              tooltip={dictionary.onboarding.tooltips.currentRate}
                            />
                            <NumberStepperInput
                              id="onboarding-current-rate"
                              name={field.name}
                              value={field.state.value}
                              className="bg-background"
                              min={0}
                              step={compensationRateStep}
                              onBlur={field.handleBlur}
                              ariaInvalid={isInvalid}
                              onChange={field.handleChange}
                            />
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        )
                      }}
                    </form.Field>
                  </div>

                  <Field>
                    <FieldDescription>{dictionary.onboarding.hints.sameRate}</FieldDescription>
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {dictionary.onboarding.steps.workSettings}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.onboarding.descriptions.workSettings}
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
                            showBreakMinute={selectedCompensationType === "hourly"}
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
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      )
                    }}
                  </form.Field>
                </>
              )}
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

              <div className="flex items-center justify-end gap-2">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isShowingCompletionAnimation}
                    onClick={handlePreviousStep}
                  >
                    {dictionary.onboarding.actions.previous}
                  </Button>
                )}

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
                )}
              </div>
            </div>
          </form>
      </OnboardingWizardShell>

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
