"use client"

import { useMemo, useRef, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useStore } from "@tanstack/react-store"
import { InfoIcon } from "lucide-react"
import { z } from "zod"

import { useCompanyCatalogListQuery } from "@/app/hooks/companies/use-company-catalog"
import { useRoleCatalogListQuery } from "@/app/hooks/roles/use-role-catalog"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  currencyOptions,
  getCompensationRateStep,
} from "@/app/lib/models/onboarding/onboarding-form.model"
import { getRandomCompanyColor, isValidCompanyColor } from "@/app/lib/models/personal-path/company-colors"
import type { PathCompaniesCreateInput } from "@/app/lib/models/personal-path/path-companies.model"
import { NumberStepperInput } from "@/components/onboarding/number-stepper-input"
import { SingleDatePickerField } from "@/components/shared/single-date-picker-field"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CreateCompanyDialogProps {
  onCreate: (input: {
    company: PathCompaniesCreateInput
    initialRate: number
    finalRate: number | null
  }) => Promise<void>
  disabled?: boolean
  isPending?: boolean
}

interface CreateCompanyFormValues {
  companyName: string
  roleName: string
  startDate: Date | null
  endDate: Date | null
  compensationType: "hourly" | "monthly"
  currency: string
  initialRate: number
  finalRate: string
  color: string
}

function buildDefaultValues(): CreateCompanyFormValues {
  return {
    companyName: "",
    roleName: "",
    startDate: null,
    endDate: null,
    compensationType: "monthly",
    currency: "USD",
    initialRate: 0,
    finalRate: "",
    color: getRandomCompanyColor(),
  }
}

function isFutureDate(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
}

function normalizeNonNegativeAmountInput(rawValue: string): string | null {
  const value = rawValue.trim()

  if (value.length === 0) {
    return ""
  }

  if (!/^\d*\.?\d*$/.test(value)) {
    return null
  }

  if (value === ".") {
    return "0."
  }

  const [integerPartRaw = "", decimalPartRaw] = value.split(".")
  const normalizedIntegerPart = integerPartRaw.replace(/^0+(?=\d)/, "") || "0"
  const hasDecimalPart = decimalPartRaw !== undefined
  const normalizedValue = hasDecimalPart
    ? `${normalizedIntegerPart}.${decimalPartRaw}`
    : normalizedIntegerPart

  const parsed = Number(normalizedValue)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return normalizedValue
}

export function CreateCompanyDialog({ onCreate, disabled = false, isPending = false }: CreateCompanyDialogProps) {
  const { dictionary } = useDictionary()
  const [open, setOpen] = useState(false)
  const [companySearch, setCompanySearch] = useState("")
  const [roleSearch, setRoleSearch] = useState("")
  const dialogContentRef = useRef<HTMLDivElement | null>(null)

  const schema = useMemo(
    () =>
      z
        .object({
          companyName: z.string().trim().min(1, dictionary.companies.validations.companyName),
          roleName: z.string().trim().min(1, dictionary.companies.validations.roleName),
          startDate: z.date().nullable(),
          endDate: z.date().nullable(),
          compensationType: z.enum(["hourly", "monthly"]),
          currency: z.string().trim().min(1),
          initialRate: z.number().min(0, dictionary.companies.validations.initialRate),
          finalRate: z
            .string()
            .trim()
            .refine((value) => value.length === 0 || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
              message: dictionary.companies.validations.currentRate,
            }),
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
          (value) =>
            !value.startDate ||
            isFutureDate(value.startDate) ||
            value.endDate !== null,
          {
            message: dictionary.companies.validations.endDateRequired,
            path: ["endDate"],
          }
        )
        .refine(
          (value) => !value.startDate || !value.endDate || value.endDate.getTime() >= value.startDate.getTime(),
          {
            message: dictionary.companies.validations.endDate,
            path: ["endDate"],
          }
        ),
    [dictionary]
  )

  const initialDefaults = useMemo<CreateCompanyFormValues>(() => buildDefaultValues(), [])

  const form = useForm({
    defaultValues: initialDefaults,
    validators: {
      onChange: schema,
      onBlur: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      if (!value.startDate) {
        return
      }

      if (!isFutureDate(value.startDate) && !value.endDate) {
        return
      }

      const finalRateValue = value.finalRate.trim()

      await onCreate({
        company: {
          companyName: value.companyName.trim(),
          roleName: value.roleName.trim(),
          startDate: value.startDate.toISOString(),
          endDate: value.endDate ? value.endDate.toISOString() : null,
          compensationType: value.compensationType,
          currency: value.currency,
          color: value.color,
        },
        initialRate: value.initialRate,
        finalRate: finalRateValue.length ? Number(finalRateValue) : null,
      })

      const nextDefaults = buildDefaultValues()
      form.reset(nextDefaults)
      setCompanySearch("")
      setRoleSearch("")
      setOpen(false)
    },
  })

  const companyCatalogQuery = useCompanyCatalogListQuery({
    limit: 10,
    search: companySearch.trim() || undefined,
    enabled: open,
  })

  const roleCatalogQuery = useRoleCatalogListQuery({
    limit: 10,
    search: roleSearch.trim() || undefined,
    enabled: open,
  })

  const formValues = useStore(form.store, () => form.state.values)
  const isFormSubmitting = useStore(form.store, () => form.state.isSubmitting)
  const compensationRateStep = getCompensationRateStep(
    formValues.compensationType,
    formValues.currency
  )

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

  const requiresEndDate = formValues.startDate ? !isFutureDate(formValues.startDate) : false

  const canCreateCompany =
    formValues.companyName.trim().length > 0 &&
    formValues.roleName.trim().length > 0 &&
    formValues.startDate !== null &&
    (!requiresEndDate || formValues.endDate !== null) &&
    formValues.currency.trim().length > 0 &&
    formValues.initialRate >= 0 &&
    (formValues.finalRate.trim().length === 0 ||
      (!Number.isNaN(Number(formValues.finalRate.trim())) &&
        Number(formValues.finalRate.trim()) >= 0))

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (nextOpen) {
          const nextDefaults = buildDefaultValues()
          form.reset(nextDefaults)
          setCompanySearch("")
          setRoleSearch("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" disabled={disabled || isPending} className="hover:bg-primary/90">
          {dictionary.companies.actions.addCompany}
        </Button>
      </DialogTrigger>

      <DialogContent ref={dialogContentRef} className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{dictionary.companies.dialogs.addCompanyTitle}</DialogTitle>
          <DialogDescription>{dictionary.companies.dialogs.addCompanyDescription}</DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="companyName">
              {(field) => {
                const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="create-company-name">{dictionary.companies.labels.companyName}</FieldLabel>
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
                        id="create-company-name"
                        name={field.name}
                        onBlur={field.handleBlur}
                        onKeyDown={(eventKeyDown) => {
                          const expanded = eventKeyDown.currentTarget.getAttribute("aria-expanded") === "true"
                          if (eventKeyDown.key === "Enter" && !expanded) {
                            eventKeyDown.preventDefault()
                          }
                        }}
                        aria-invalid={isInvalid}
                        placeholder={dictionary.companies.placeholders.companyName}
                        disabled={isPending}
                      />
                      <ComboboxContent portalContainer={dialogContentRef}>
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
                    <FieldLabel htmlFor="create-company-role">{dictionary.companies.labels.roleName}</FieldLabel>
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
                        id="create-company-role"
                        name={field.name}
                        onBlur={field.handleBlur}
                        onKeyDown={(eventKeyDown) => {
                          const expanded = eventKeyDown.currentTarget.getAttribute("aria-expanded") === "true"
                          if (eventKeyDown.key === "Enter" && !expanded) {
                            eventKeyDown.preventDefault()
                          }
                        }}
                        aria-invalid={isInvalid}
                        placeholder={dictionary.companies.placeholders.roleName}
                        disabled={isPending}
                      />
                      <ComboboxContent portalContainer={dialogContentRef}>
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

            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="startDate">
                {(field) => {
                  const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="create-company-start">{dictionary.companies.labels.startDate}</FieldLabel>
                      <SingleDatePickerField
                        id="create-company-start"
                        value={field.state.value}
                        onChange={(nextStartDate) => {
                          field.handleChange(nextStartDate)

                          const currentEndDate = form.state.values.endDate
                          if (!nextStartDate || !currentEndDate) {
                            if (currentEndDate) {
                              form.setFieldValue("endDate", null)
                            }
                            return
                          }

                          if (currentEndDate.getTime() < nextStartDate.getTime()) {
                            form.setFieldValue("endDate", null)
                          }
                        }}
                        onBlur={field.handleBlur}
                        ariaInvalid={isInvalid}
                        placeholder={dictionary.companies.placeholders.startDate}
                        disabled={isPending}
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
                      <FieldLabel htmlFor="create-company-end">{dictionary.companies.labels.endDate}</FieldLabel>
                      <SingleDatePickerField
                        id="create-company-end"
                        value={field.state.value}
                        onChange={field.handleChange}
                        onBlur={field.handleBlur}
                        ariaInvalid={isInvalid}
                        placeholder={dictionary.companies.placeholders.endDate}
                        allowClear
                        disabled={isPending || !formValues.startDate}
                        disabledDays={formValues.startDate ? { before: formValues.startDate } : undefined}
                      />
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  )
                }}
              </form.Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="compensationType">
                {(field) => {
                  const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="create-company-compensation">
                        {dictionary.companies.labels.compensationType}
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value as "hourly" | "monthly")}
                        disabled={isPending}
                      >
                        <SelectTrigger id="create-company-compensation" aria-invalid={isInvalid}>
                          <SelectValue placeholder={dictionary.companies.labels.compensationType} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">{dictionary.companies.options.compensationHourly}</SelectItem>
                          <SelectItem value="monthly">{dictionary.companies.options.compensationMonthly}</SelectItem>
                        </SelectContent>
                      </Select>
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  )
                }}
              </form.Field>

              <form.Field name="currency">
                {(field) => {
                  const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="create-company-currency">{dictionary.companies.labels.currency}</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={field.handleChange}
                        disabled={isPending}
                      >
                        <SelectTrigger id="create-company-currency" aria-invalid={isInvalid}>
                          <SelectValue placeholder={dictionary.companies.placeholders.selectCurrency} />
                        </SelectTrigger>
                        <SelectContent>
                          {currencyOptions.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  )
                }}
              </form.Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="initialRate">
                {(field) => {
                  const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <div className="flex items-center gap-1.5">
                        <FieldLabel htmlFor="create-company-initial-rate">
                          {dictionary.companies.labels.initialRate}
                        </FieldLabel>
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="h-5 w-5 rounded-full"
                                aria-label={dictionary.companies.hints.eventsEditable}
                              >
                                <InfoIcon className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {dictionary.companies.hints.eventsEditable}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <NumberStepperInput
                        id="create-company-initial-rate"
                        name={field.name}
                        value={field.state.value}
                        min={0}
                        step={compensationRateStep}
                        onChange={field.handleChange}
                        onBlur={field.handleBlur}
                        ariaInvalid={isInvalid}
                        disabled={isPending}
                      />
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  )
                }}
              </form.Field>

              <form.Field name="finalRate">
                {(field) => {
                  const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="create-company-final-rate">
                        {dictionary.companies.labels.currentRate}
                      </FieldLabel>
                      <Input
                        id="create-company-final-rate"
                        name={field.name}
                        type="number"
                        min={0}
                        step={String(compensationRateStep)}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          const normalizedValue = normalizeNonNegativeAmountInput(event.target.value)
                          if (normalizedValue === null) {
                            return
                          }

                          field.handleChange(normalizedValue)
                        }}
                        aria-invalid={isInvalid}
                        placeholder={dictionary.companies.placeholders.currentRate}
                        disabled={isPending}
                      />
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  )
                }}
              </form.Field>
            </div>

            <form.Field name="color">
              {(field) => {
                const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="create-company-color">{dictionary.companies.labels.color}</FieldLabel>
                    <ColorPicker
                      id="create-company-color"
                      value={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      className="w-14"
                      disabled={isPending}
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              {dictionary.companies.actions.cancel}
            </Button>
            <Button
              type="submit"
              className="hover:bg-primary/90"
              disabled={!canCreateCompany || isFormSubmitting || isPending}
            >
              {dictionary.companies.actions.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
