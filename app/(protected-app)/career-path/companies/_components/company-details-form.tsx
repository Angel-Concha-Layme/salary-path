"use client"

import { useMemo, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useStore } from "@tanstack/react-store"
import { ChevronDownIcon } from "lucide-react"
import { z } from "zod"

import { useCompanyCatalogListQuery } from "@/app/hooks/companies/use-company-catalog"
import { useRoleCatalogListQuery } from "@/app/hooks/roles/use-role-catalog"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  CompensationType,
  compensationTypeSchema,
  currencyCodeSchema,
  isCompensationType,
  type CompensationTypeValue,
} from "@/app/lib/models/common/domain-enums"
import type {
  PathCompaniesEntity,
  PathCompaniesUpdateInput,
} from "@/app/lib/models/personal-path/path-companies.model"
import { isValidCompanyColor } from "@/app/lib/models/personal-path/company-colors"
import { currencyOptions } from "@/app/lib/models/onboarding/onboarding-form.model"
import {
  areWorkSchedulesEqual,
  buildDefaultWorkSchedule,
  normalizeWorkSchedule,
  workScheduleSchema,
  type WorkSchedule,
} from "@/app/lib/models/work-schedule/work-schedule.model"
import { SingleDatePickerField } from "@/components/shared/single-date-picker-field"
import { WorkScheduleEditor } from "@/components/work-schedule-editor"
import { WorkScheduleSummary } from "@/components/work-schedule-summary"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CompanyDetailsFormProps {
  company: PathCompaniesEntity
  onSubmit: (input: PathCompaniesUpdateInput) => Promise<void>
  onDelete: () => Promise<void>
  isSaving?: boolean
  isDeleting?: boolean
}

interface CompanyDetailsFormValues {
  companyName: string
  roleName: string
  startDate: Date | null
  endDate: Date | null
  compensationType: CompensationTypeValue
  currency: string
  color: string
  workSchedule: WorkSchedule
}

interface PendingCompensationChange {
  payload: PathCompaniesUpdateInput
  nextValues: CompanyDetailsFormValues
  from: CompensationTypeValue
  to: CompensationTypeValue
}

export function CompanyDetailsForm({
  company,
  onSubmit,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: CompanyDetailsFormProps) {
  const { dictionary } = useDictionary()
  const [companySearch, setCompanySearch] = useState("")
  const [roleSearch, setRoleSearch] = useState("")
  const [shouldLoadCompanyCatalog, setShouldLoadCompanyCatalog] = useState(false)
  const [shouldLoadRoleCatalog, setShouldLoadRoleCatalog] = useState(false)
  const [pendingCompensationChange, setPendingCompensationChange] =
    useState<PendingCompensationChange | null>(null)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [workScheduleDraft, setWorkScheduleDraft] = useState<WorkSchedule | null>(null)
  const [isWorkScheduleExpanded, setIsWorkScheduleExpanded] = useState(true)
  const companySearchTerm = companySearch.trim()
  const roleSearchTerm = roleSearch.trim()

  const schema = useMemo(
    () =>
      z
        .object({
          companyName: z.string().trim().min(1, dictionary.companies.validations.companyName),
          roleName: z.string().trim().min(1, dictionary.companies.validations.roleName),
          startDate: z.date().nullable(),
          endDate: z.date().nullable(),
          compensationType: compensationTypeSchema,
          currency: currencyCodeSchema,
          workSchedule: workScheduleSchema,
          color: z
            .string()
            .trim()
            .transform((value) => value.toUpperCase())
            .refine((value) => isValidCompanyColor(value), {
              message: dictionary.companies.validations.color,
            }),
        })
        .refine((value) => value.startDate !== null, {
          message: dictionary.companies.validations.startDate,
          path: ["startDate"],
        })
        .refine(
          (value) => !value.startDate || !value.endDate || value.endDate.getTime() >= value.startDate.getTime(),
          {
            message: dictionary.companies.validations.endDate,
            path: ["endDate"],
          }
        ),
    [dictionary]
  )

  const companyCatalogQuery = useCompanyCatalogListQuery({
    limit: 10,
    search: companySearchTerm || undefined,
    enabled: shouldLoadCompanyCatalog || companySearchTerm.length > 0,
  })

  const roleCatalogQuery = useRoleCatalogListQuery({
    limit: 10,
    search: roleSearchTerm || undefined,
    enabled: shouldLoadRoleCatalog || roleSearchTerm.length > 0,
  })

  const defaultValues = useMemo<CompanyDetailsFormValues>(
    () => ({
      companyName: company.displayName,
      roleName: company.roleDisplayName,
      startDate: new Date(company.startDate),
      endDate: company.endDate ? new Date(company.endDate) : null,
      compensationType: company.compensationType,
      currency: company.currency,
      color: company.color,
      workSchedule: normalizeWorkSchedule(company.workSchedule ?? buildDefaultWorkSchedule()),
    }),
    [
      company.color,
      company.compensationType,
      company.currency,
      company.displayName,
      company.endDate,
      company.workSchedule,
      company.roleDisplayName,
      company.startDate,
    ]
  )

  const form = useForm({
    defaultValues,
    validators: {
      onChange: schema,
      onBlur: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      if (!value.startDate) {
        return
      }

      const normalizedWorkSchedule = normalizeWorkSchedule(value.workSchedule)
      const sanitizedWorkSchedule =
        value.compensationType === CompensationType.MONTHLY
          ? normalizedWorkSchedule.map((day) => ({
            ...day,
            breakMinute: day.isWorkingDay ? 0 : null,
          }))
          : normalizedWorkSchedule

      const payload: PathCompaniesUpdateInput = {}

      const trimmedCompanyName = value.companyName.trim()
      const trimmedRoleName = value.roleName.trim()

      if (trimmedCompanyName !== company.displayName) {
        payload.companyName = trimmedCompanyName
      }

      if (trimmedRoleName !== company.roleDisplayName) {
        payload.roleName = trimmedRoleName
      }

      if (value.startDate.toISOString() !== company.startDate) {
        payload.startDate = value.startDate.toISOString()
      }

      const nextEndDate = value.endDate ? value.endDate.toISOString() : null
      if (nextEndDate !== company.endDate) {
        payload.endDate = nextEndDate
      }

      if (value.compensationType !== company.compensationType) {
        payload.compensationType = value.compensationType
      }

      if (value.currency !== company.currency) {
        payload.currency = value.currency
      }

      if (value.color.toUpperCase() !== company.color.toUpperCase()) {
        payload.color = value.color
      }

      const nextWorkSchedule = sanitizedWorkSchedule
      const currentWorkSchedule = normalizeWorkSchedule(
        company.workSchedule ?? buildDefaultWorkSchedule()
      )
      const isScheduleUnchanged = areWorkSchedulesEqual(nextWorkSchedule, currentWorkSchedule)

      if (!isScheduleUnchanged) {
        payload.workSchedule = nextWorkSchedule
      }

      if (Object.keys(payload).length === 0) {
        return
      }

      if (value.compensationType !== company.compensationType) {
        setPendingCompensationChange({
          payload,
          nextValues: {
            ...value,
            workSchedule: sanitizedWorkSchedule,
          },
          from: company.compensationType,
          to: value.compensationType,
        })
        return
      }

      await onSubmit(payload)

      form.reset({
        ...value,
        workSchedule: sanitizedWorkSchedule,
      })
      setIsScheduleDialogOpen(false)
      setWorkScheduleDraft(null)
      setCompanySearch("")
      setRoleSearch("")
    },
  })

  const formValues = useStore(form.store, () => form.state.values)
  const isDirty = useStore(form.store, () => form.state.isDirty)
  const isFormSubmitting = useStore(form.store, () => form.state.isSubmitting)

  const companyOptions = useMemo(() => {
    const names = (companyCatalogQuery.data?.items ?? []).map((item) => item.name)
    const current = formValues.companyName
    return current ? Array.from(new Set([current, ...names])) : names
  }, [companyCatalogQuery.data?.items, formValues.companyName])

  const roleOptions = useMemo(() => {
    const names = (roleCatalogQuery.data?.items ?? []).map((item) => item.name)
    const current = formValues.roleName
    return current ? Array.from(new Set([current, ...names])) : names
  }, [roleCatalogQuery.data?.items, formValues.roleName])

  async function confirmCompensationChange() {
    if (!pendingCompensationChange) {
      return
    }

    await onSubmit(pendingCompensationChange.payload)
    form.reset(pendingCompensationChange.nextValues)
    setIsScheduleDialogOpen(false)
    setWorkScheduleDraft(null)
    setCompanySearch("")
    setRoleSearch("")
    setPendingCompensationChange(null)
  }

  function getCompensationChangeDescription(): string {
    if (!pendingCompensationChange) {
      return ""
    }

    if (
      pendingCompensationChange.from === CompensationType.MONTHLY &&
      pendingCompensationChange.to === CompensationType.HOURLY
    ) {
      return dictionary.companies.dialogs.compensationTypeMonthlyToHourlyDescription
    }

    return dictionary.companies.dialogs.compensationTypeHourlyToMonthlyDescription
  }

  return (
    <form
      className="flex min-h-full flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <form.Field name="companyName">
            {(field) => {
              const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={`company-details-name-${company.id}`}>
                    {dictionary.companies.labels.companyName}
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
                      id={`company-details-name-${company.id}`}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onFocus={() => setShouldLoadCompanyCatalog(true)}
                      onKeyDown={(event) => {
                        const expanded = event.currentTarget.getAttribute("aria-expanded") === "true"
                        if (event.key === "Enter" && !expanded) {
                          event.preventDefault()
                        }
                      }}
                      aria-invalid={isInvalid}
                      placeholder={dictionary.companies.placeholders.companyName}
                      disabled={isSaving || isDeleting}
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
                  <FieldLabel htmlFor={`company-details-role-${company.id}`}>
                    {dictionary.companies.labels.roleName}
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
                      id={`company-details-role-${company.id}`}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onFocus={() => setShouldLoadRoleCatalog(true)}
                      onKeyDown={(event) => {
                        const expanded = event.currentTarget.getAttribute("aria-expanded") === "true"
                        if (event.key === "Enter" && !expanded) {
                          event.preventDefault()
                        }
                      }}
                      aria-invalid={isInvalid}
                      placeholder={dictionary.companies.placeholders.roleName}
                      disabled={isSaving || isDeleting}
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

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <form.Field name="startDate">
            {(field) => {
              const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={`company-details-start-${company.id}`}>
                    {dictionary.companies.labels.startDate}
                  </FieldLabel>
                  <SingleDatePickerField
                    id={`company-details-start-${company.id}`}
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    ariaInvalid={isInvalid}
                    placeholder={dictionary.companies.placeholders.startDate}
                    disabled={isSaving || isDeleting}
                    triggerClassName="h-8"
                  />
                  {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="endDate">
            {(field) => {
              const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={`company-details-end-${company.id}`}>
                    {dictionary.companies.labels.endDate}
                  </FieldLabel>
                  <SingleDatePickerField
                    id={`company-details-end-${company.id}`}
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    ariaInvalid={isInvalid}
                    placeholder={dictionary.companies.placeholders.endDate}
                    disabled={isSaving || isDeleting}
                    triggerClassName="h-8"
                  />
                  {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                </Field>
              )
            }}
          </form.Field>
        </div>

        <form.Field name="compensationType">
          {(field) => {
            const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={`company-details-compensation-${company.id}`}>
                  {dictionary.companies.labels.compensationType}
                </FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (!isCompensationType(value)) {
                      return
                    }

                    field.handleChange(value)
                  }}
                  disabled={isSaving || isDeleting}
                >
                  <SelectTrigger id={`company-details-compensation-${company.id}`} aria-invalid={isInvalid}>
                    <SelectValue placeholder={dictionary.companies.labels.compensationType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CompensationType.HOURLY}>
                      {dictionary.companies.options.compensationHourly}
                    </SelectItem>
                    <SelectItem value={CompensationType.MONTHLY}>
                      {dictionary.companies.options.compensationMonthly}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            )
          }}
        </form.Field>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <form.Field name="currency">
            {(field) => {
              const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={`company-details-currency-${company.id}`}>
                    {dictionary.companies.labels.currency}
                  </FieldLabel>
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
                      id={`company-details-currency-${company.id}`}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onKeyDown={(event) => {
                        const expanded = event.currentTarget.getAttribute("aria-expanded") === "true"
                        if (event.key === "Enter" && !expanded) {
                          event.preventDefault()
                        }
                      }}
                      aria-invalid={isInvalid}
                      placeholder={dictionary.companies.placeholders.selectCurrency}
                      disabled={isSaving || isDeleting}
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

          <form.Field name="color">
            {(field) => {
              const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={`company-details-color-${company.id}`}>
                    {dictionary.companies.labels.color}
                  </FieldLabel>
                  <ColorPicker
                    id={`company-details-color-${company.id}`}
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    disabled={isSaving || isDeleting}
                  />
                  {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                </Field>
              )
            }}
          </form.Field>
        </div>

        <form.Field name="workSchedule">
          {(field) => {
            const showBreakMinute = formValues.compensationType === "hourly"
            const isScheduleDisabled = isSaving || isDeleting
            const currentSchedule = normalizeWorkSchedule(field.state.value)
            const draftSchedule = normalizeWorkSchedule(workScheduleDraft ?? currentSchedule)
            const hasScheduleChanges = !areWorkSchedulesEqual(draftSchedule, currentSchedule)

            return (
              <Field>
                <section className="rounded-lg bg-background/55 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                      onClick={() => setIsWorkScheduleExpanded((current) => !current)}
                      aria-expanded={isWorkScheduleExpanded}
                    >
                      <FieldLabel className="p-0">{dictionary.profile.workSettings.weeklyScheduleLabel}</FieldLabel>
                      <ChevronDownIcon
                        className={`size-4 shrink-0 text-muted-foreground transition-transform ${isWorkScheduleExpanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    <Dialog
                      open={isScheduleDialogOpen}
                      onOpenChange={(open) => {
                        setIsScheduleDialogOpen(open)

                        if (open) {
                          setWorkScheduleDraft(normalizeWorkSchedule(field.state.value))
                          return
                        }

                        setWorkScheduleDraft(null)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="rounded-full border-border/70 bg-background/70 px-2.5"
                          disabled={isScheduleDisabled}
                        >
                          {dictionary.companies.actions.editWorkSchedule}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-none sm:w-[min(98vw,1360px)]">
                        <DialogHeader>
                          <DialogTitle>{dictionary.companies.dialogs.editWorkScheduleTitle}</DialogTitle>
                          <DialogDescription>
                            {dictionary.companies.dialogs.editWorkScheduleDescription}
                          </DialogDescription>
                        </DialogHeader>

                        <WorkScheduleEditor
                          value={draftSchedule}
                          onChange={setWorkScheduleDraft}
                          disabled={isSaving || isDeleting}
                          showDescription={false}
                          showBreakMinute={showBreakMinute}
                        />

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsScheduleDialogOpen(false)
                              setWorkScheduleDraft(null)
                            }}
                            disabled={isSaving || isDeleting}
                          >
                            {dictionary.companies.actions.cancel}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              if (!hasScheduleChanges) {
                                return
                              }

                              const sanitizedDraft =
                                formValues.compensationType === CompensationType.MONTHLY
                                  ? draftSchedule.map((day) => ({
                                    ...day,
                                    breakMinute: day.isWorkingDay ? 0 : null,
                                  }))
                                  : draftSchedule

                              void onSubmit({ workSchedule: sanitizedDraft }).then(() => {
                                field.handleChange(sanitizedDraft)
                                setIsScheduleDialogOpen(false)
                                setWorkScheduleDraft(null)
                              })
                            }}
                            disabled={isSaving || isDeleting || !hasScheduleChanges}
                          >
                            {dictionary.companies.actions.saveWorkSchedule}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {isWorkScheduleExpanded ? (
                    <div className="mt-2">
                      <WorkScheduleSummary
                        schedule={field.state.value}
                        showBreakMinute={showBreakMinute}
                      />
                    </div>
                  ) : null}
                </section>
              </Field>
            )
          }}
        </form.Field>
      </FieldGroup>

      <div className="sticky bottom-0 z-20 -mx-1 mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-background/95 px-1 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
        <AlertDialog
          open={pendingCompensationChange !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPendingCompensationChange(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dictionary.companies.dialogs.compensationTypeChangeTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {getCompensationChangeDescription()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSaving || isDeleting || isFormSubmitting}>
                {dictionary.companies.actions.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  void confirmCompensationChange()
                }}
                disabled={isSaving || isDeleting || isFormSubmitting}
              >
                {dictionary.companies.dialogs.confirmCompensationTypeChange}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={isSaving || isDeleting}>
              {dictionary.companies.actions.deleteCompany}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dictionary.companies.dialogs.deleteCompanyTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {dictionary.companies.dialogs.deleteCompanyDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSaving || isDeleting}>
                {dictionary.companies.actions.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void onDelete()}
                variant="destructive"
                disabled={isSaving || isDeleting}
              >
                {dictionary.companies.actions.deleteCompany}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset()
              setIsScheduleDialogOpen(false)
              setWorkScheduleDraft(null)
              setCompanySearch("")
              setRoleSearch("")
            }}
            disabled={!isDirty || isSaving || isDeleting}
          >
            {dictionary.companies.actions.reset}
          </Button>
          <Button
            type="submit"
            className="hover:bg-primary/90"
            disabled={
              !isDirty ||
              isFormSubmitting ||
              isSaving ||
              isDeleting
            }
          >
            {dictionary.companies.actions.save}
          </Button>
        </div>
      </div>
    </form>
  )
}
