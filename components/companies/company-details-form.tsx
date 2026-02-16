"use client"

import { useMemo, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useStore } from "@tanstack/react-store"
import { InfoIcon } from "lucide-react"
import { z } from "zod"

import { useCompanyCatalogListQuery } from "@/app/hooks/companies/use-company-catalog"
import { useRoleCatalogListQuery } from "@/app/hooks/roles/use-role-catalog"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import type {
  PathCompaniesEntity,
  PathCompaniesUpdateInput,
} from "@/app/lib/models/personal-path/path-companies.model"
import { isValidCompanyColor } from "@/app/lib/models/personal-path/company-colors"
import { currencyOptions } from "@/app/lib/models/onboarding/onboarding-form.model"
import { SingleDatePickerField } from "@/components/shared/single-date-picker-field"
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  compensationType: "hourly" | "monthly"
  currency: string
  score: number
  color: string
  review: string
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
          compensationType: z.enum(["hourly", "monthly"]),
          currency: z.string().trim().min(1),
          score: z.number().int().min(1, dictionary.companies.validations.score).max(10, dictionary.companies.validations.score),
          review: z.string().trim().max(1000, dictionary.companies.validations.review),
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
      score: company.score,
      color: company.color,
      review: company.review,
    }),
    [
      company.color,
      company.compensationType,
      company.currency,
      company.review,
      company.score,
      company.displayName,
      company.endDate,
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

      await onSubmit({
        companyName: value.companyName.trim(),
        roleName: value.roleName.trim(),
        startDate: value.startDate.toISOString(),
        endDate: value.endDate ? value.endDate.toISOString() : null,
        compensationType: value.compensationType,
        currency: value.currency,
        score: value.score,
        color: value.color,
        review: value.review.trim(),
      })

      form.reset(value)
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

  return (
    <form
      className="space-y-5"
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

        <div className="grid gap-4 md:grid-cols-2">
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
                  <FieldLabel htmlFor={`company-details-compensation-${company.id}`}>
                    {dictionary.companies.labels.compensationType}
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as "hourly" | "monthly")}
                    disabled={isSaving || isDeleting}
                  >
                    <SelectTrigger id={`company-details-compensation-${company.id}`} aria-invalid={isInvalid}>
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
                  <FieldLabel htmlFor={`company-details-currency-${company.id}`}>
                    {dictionary.companies.labels.currency}
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    disabled={isSaving || isDeleting}
                  >
                    <SelectTrigger id={`company-details-currency-${company.id}`} aria-invalid={isInvalid}>
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

          <form.Field name="score">
            {(field) => {
              const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid
              const value = Number.isFinite(field.state.value) ? field.state.value : 5

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={`company-details-score-${company.id}`}>
                    {dictionary.companies.labels.score}: {value}
                  </FieldLabel>
                  <div className="flex h-8 items-center">
                    <Slider
                      id={`company-details-score-${company.id}`}
                      min={1}
                      max={10}
                      step={1}
                      value={[value]}
                      onValueChange={(nextValues) => {
                        const next = nextValues[0]
                        if (typeof next !== "number") {
                          return
                        }

                        field.handleChange(next)
                      }}
                      onValueCommit={(nextValues) => {
                        const next = nextValues[0]
                        if (typeof next !== "number") {
                          return
                        }

                        field.handleChange(next)
                        field.handleBlur()
                      }}
                      disabled={isSaving || isDeleting}
                      aria-invalid={isInvalid}
                    />
                  </div>
                  {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                </Field>
              )
            }}
          </form.Field>
        </div>

        <form.Field name="review">
          {(field) => {
            const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <div className="flex items-center gap-1.5">
                  <FieldLabel htmlFor={`company-details-review-${company.id}`}>
                    {dictionary.companies.labels.review}
                  </FieldLabel>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="h-5 w-5 rounded-full"
                          aria-label={dictionary.companies.hints.companyReview}
                        >
                          <InfoIcon className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {dictionary.companies.hints.companyReview}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id={`company-details-review-${company.id}`}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(eventChange) => field.handleChange(eventChange.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={dictionary.companies.placeholders.review}
                  disabled={isSaving || isDeleting}
                />
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            )
          }}
        </form.Field>
      </FieldGroup>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
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
