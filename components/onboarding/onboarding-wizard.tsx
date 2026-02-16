"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useStore } from "@tanstack/react-store"
import { toast } from "sonner"

import { useCompanyCatalogListQuery } from "@/app/hooks/companies/use-company-catalog"
import { useRoleCatalogListQuery } from "@/app/hooks/roles/use-role-catalog"
import { useCompleteOnboardingMutation } from "@/app/hooks/onboarding/use-onboarding"
import {
  currencyOptions,
  getCompensationRateStep,
  onboardingDefaultValues,
  onboardingFormSchema,
  onboardingStepSchemas,
  type OnboardingFormValues,
} from "@/app/lib/models/onboarding/onboarding-form.model"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { SingleDatePickerField } from "@/components/shared/single-date-picker-field"
import { NumberStepperInput } from "@/components/onboarding/number-stepper-input"
import { OnboardingWizardShell } from "@/components/onboarding/onboarding-wizard-shell"
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

const STEP_FIELD_NAMES: Array<Array<keyof OnboardingFormValues>> = [
  ["companyName", "roleName", "startDate"],
  ["compensationType", "currency", "initialRate", "currentRate"],
  ["monthlyWorkHours", "workDaysPerYear"],
]

export function OnboardingWizard() {
  const router = useRouter()
  const { dictionary, locale } = useDictionary()
  const completeOnboardingMutation = useCompleteOnboardingMutation()
  const [step, setStep] = useState(0)
  const [companySearch, setCompanySearch] = useState("")
  const [roleSearch, setRoleSearch] = useState("")
  const [isShowingCompletionAnimation, setIsShowingCompletionAnimation] = useState(false)
  const [monthlyWorkHoursLimitFeedback, setMonthlyWorkHoursLimitFeedback] = useState(false)
  const [workDaysPerYearLimitFeedback, setWorkDaysPerYearLimitFeedback] = useState(false)

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
          monthlyWorkHours: value.monthlyWorkHours,
          workDaysPerYear: value.workDaysPerYear,
          locale,
        })

        const elapsedMs = Date.now() - submitStartedAt
        if (elapsedMs < COMPLETION_ANIMATION_DURATION_MS) {
          await new Promise((resolve) =>
            setTimeout(resolve, COMPLETION_ANIMATION_DURATION_MS - elapsedMs)
          )
        }

        toast.success(dictionary.onboarding.toasts.success)
        router.push("/personal-path")
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
      setMonthlyWorkHoursLimitFeedback(false)
      setWorkDaysPerYearLimitFeedback(false)
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
    }
  }

  function handlePreviousStep() {
    setMonthlyWorkHoursLimitFeedback(false)
    setWorkDaysPerYearLimitFeedback(false)
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

    setMonthlyWorkHoursLimitFeedback(false)
    setWorkDaysPerYearLimitFeedback(false)
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
        maxWidthClassName="max-w-6xl"
        containerClassName="flex min-h-screen items-center"
        outerPaddingClassName="px-4 py-8 sm:px-6 md:px-8"
        cardClassName="rounded-3xl border border-border/70 bg-card/95 text-card-foreground shadow-2xl backdrop-blur-sm"
      >
          <div className="border-b border-border p-6 pb-4 md:p-8 md:pb-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Salary Path</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {dictionary.onboarding.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">{dictionary.onboarding.subtitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{dictionary.onboarding.completionHint}</p>

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
            className="p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <FieldGroup>
              {step === 0 && (
                <>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {dictionary.onboarding.steps.companyRole}
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    <form.Field name="companyName">
                      {(field) => {
                        const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor="onboarding-company">
                              {dictionary.onboarding.fields.companyName}
                            </FieldLabel>
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
                            <FieldLabel htmlFor="onboarding-role">
                              {dictionary.onboarding.fields.roleName}
                            </FieldLabel>
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
                          <FieldLabel htmlFor="onboarding-start-date">
                            {dictionary.onboarding.fields.startDate}
                          </FieldLabel>
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

                  <form.Field name="compensationType">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor="onboarding-compensation-type">
                            {dictionary.onboarding.fields.compensationType}
                          </FieldLabel>
                          <Select
                            name={field.name}
                            value={field.state.value}
                            onValueChange={(v) => field.handleChange(v as "hourly" | "monthly")}
                          >
                            <SelectTrigger
                              id="onboarding-compensation-type"
                              aria-invalid={isInvalid}
                              className="h-10 bg-background"
                            >
                              <SelectValue placeholder={dictionary.onboarding.fields.compensationType} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">
                                {dictionary.onboarding.options.compensationHourly}
                              </SelectItem>
                              <SelectItem value="monthly">
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
                          <FieldLabel htmlFor="onboarding-currency">
                            {dictionary.onboarding.fields.currency}
                          </FieldLabel>
                          <Select name={field.name} value={field.state.value} onValueChange={field.handleChange}>
                            <SelectTrigger id="onboarding-currency" aria-invalid={isInvalid} className="h-10 bg-background">
                              <SelectValue placeholder={dictionary.onboarding.placeholders.selectCurrency} />
                            </SelectTrigger>
                            <SelectContent>
                              {currencyOptions.map((currency) => (
                                <SelectItem key={currency} value={currency}>
                                  {currency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      )
                    }}
                  </form.Field>

                  <div className="grid gap-4 md:grid-cols-2">
                    <form.Field name="initialRate">
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor="onboarding-initial-rate">
                              {dictionary.onboarding.fields.initialRate}
                            </FieldLabel>
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
                            <FieldLabel htmlFor="onboarding-current-rate">
                              {dictionary.onboarding.fields.currentRate}
                            </FieldLabel>
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <form.Field name="monthlyWorkHours">
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor="onboarding-monthly-hours">
                              {dictionary.onboarding.fields.monthlyWorkHours}
                            </FieldLabel>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip open={monthlyWorkHoursLimitFeedback}>
                                <TooltipTrigger asChild>
                                  <div>
                                    <NumberStepperInput
                                      id="onboarding-monthly-hours"
                                      name={field.name}
                                      value={field.state.value}
                                      className={cn(
                                        "bg-background",
                                        monthlyWorkHoursLimitFeedback &&
                                          "border-amber-500 has-[[data-slot=input-group-control]:focus-visible]:border-amber-500 has-[[data-slot=input-group-control]:focus-visible]:ring-amber-500/35"
                                      )}
                                      min={1}
                                      max={744}
                                      step={1}
                                      onBlur={field.handleBlur}
                                      ariaInvalid={isInvalid}
                                      onChange={(nextValue) => {
                                        setMonthlyWorkHoursLimitFeedback(false)
                                        field.handleChange(nextValue)
                                      }}
                                      onClamp={({ bound }) => {
                                        if (bound === "max") {
                                          setMonthlyWorkHoursLimitFeedback(true)
                                        }
                                      }}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="bottom"
                                  align="start"
                                  className="border border-amber-300/80 bg-amber-500 text-amber-950 ring-amber-700/35"
                                >
                                  {dictionary.onboarding.hints.monthlyWorkHoursLimit}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        )
                      }}
                    </form.Field>

                    <form.Field name="workDaysPerYear">
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor="onboarding-work-days">
                              {dictionary.onboarding.fields.workDaysPerYear}
                            </FieldLabel>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip open={workDaysPerYearLimitFeedback}>
                                <TooltipTrigger asChild>
                                  <div>
                                    <NumberStepperInput
                                      id="onboarding-work-days"
                                      name={field.name}
                                      value={field.state.value}
                                      className={cn(
                                        "bg-background",
                                        workDaysPerYearLimitFeedback &&
                                          "border-amber-500 has-[[data-slot=input-group-control]:focus-visible]:border-amber-500 has-[[data-slot=input-group-control]:focus-visible]:ring-amber-500/35"
                                      )}
                                      min={1}
                                      max={366}
                                      step={1}
                                      onBlur={field.handleBlur}
                                      ariaInvalid={isInvalid}
                                      onChange={(nextValue) => {
                                        setWorkDaysPerYearLimitFeedback(false)
                                        field.handleChange(nextValue)
                                      }}
                                      onClamp={({ bound }) => {
                                        if (bound === "max") {
                                          setWorkDaysPerYearLimitFeedback(true)
                                        }
                                      }}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="bottom"
                                  align="start"
                                  className="border border-amber-300/80 bg-amber-500 text-amber-950 ring-amber-700/35"
                                >
                                  {dictionary.onboarding.hints.workDaysPerYearLimit}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        )
                      }}
                    </form.Field>
                  </div>

                  <Field>
                    <FieldDescription>{dictionary.onboarding.hints.workSettings}</FieldDescription>
                  </Field>
                </>
              )}
            </FieldGroup>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
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
                  variant="outline"
                  disabled={isShowingCompletionAnimation}
                  onClick={() => {
                    form.reset()
                    setCompanySearch("")
                    setRoleSearch("")
                    setMonthlyWorkHoursLimitFeedback(false)
                    setWorkDaysPerYearLimitFeedback(false)
                    setStep(0)
                  }}
                >
                  {dictionary.onboarding.actions.reset}
                </Button>
              </div>

              <div className="flex items-center gap-2">
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
              <span className="size-1.5 animate-pulse rounded-full bg-primary/40" />
              <span className="size-1.5 animate-pulse rounded-full bg-primary/60 [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
