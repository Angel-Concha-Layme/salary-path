"use client"

import { useMemo } from "react"
import { useForm } from "@tanstack/react-form"
import { useStore } from "@tanstack/react-store"
import { z } from "zod"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  isPathCompanyEventType,
  type CompensationTypeValue,
} from "@/app/lib/models/common/domain-enums"
import { getCompensationRateStep } from "@/app/lib/models/onboarding/onboarding-form.model"
import {
  pathCompanyEventTypeOptions,
  type PathCompanyEventsEntity,
  type PathCompanyEventsUpdateInput,
} from "@/app/lib/models/personal-path/path-company-events.model"
import { NumberStepperInput } from "@/components/onboarding/number-stepper-input"
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface EventDetailsFormProps {
  event: PathCompanyEventsEntity
  compensationType: CompensationTypeValue
  currency: string
  onSubmit: (input: PathCompanyEventsUpdateInput) => Promise<void>
  onDelete: () => Promise<void>
  isSaving?: boolean
  isDeleting?: boolean
}

interface EventDetailsFormValues {
  eventType: PathCompanyEventsEntity["eventType"]
  effectiveDate: Date | null
  amount: number
  notes: string
}

export function EventDetailsForm({
  event,
  compensationType,
  currency,
  onSubmit,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: EventDetailsFormProps) {
  const { dictionary } = useDictionary()
  const compensationRateStep = getCompensationRateStep(compensationType, currency)

  const schema = useMemo(
    () =>
      z
        .object({
          eventType: z.enum(pathCompanyEventTypeOptions),
          effectiveDate: z.date().nullable(),
          amount: z.number().min(0, dictionary.companies.validations.amount),
          notes: z.string().max(1000),
        })
        .refine((value) => value.effectiveDate !== null, {
          message: dictionary.companies.validations.effectiveDate,
          path: ["effectiveDate"],
        }),
    [dictionary]
  )

  const defaultValues = useMemo<EventDetailsFormValues>(
    () => ({
      eventType: event.eventType,
      effectiveDate: new Date(event.effectiveDate),
      amount: event.amount,
      notes: event.notes ?? "",
    }),
    [event.amount, event.effectiveDate, event.eventType, event.notes]
  )

  const form = useForm({
    defaultValues,
    validators: {
      onChange: schema,
      onBlur: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      if (!value.effectiveDate) {
        return
      }

      const normalizedNotes = value.notes.trim()

      await onSubmit({
        eventType: value.eventType,
        effectiveDate: value.effectiveDate.toISOString(),
        amount: value.amount,
        notes: normalizedNotes.length ? normalizedNotes : null,
      })

      form.reset({
        ...value,
        notes: normalizedNotes,
      })
    },
  })

  const isDirty = useStore(form.store, () => form.state.isDirty)
  const isFormSubmitting = useStore(form.store, () => form.state.isSubmitting)

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(eventSubmit) => {
        eventSubmit.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field name="eventType">
          {(field) => {
            const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={`event-details-type-${event.id}`}>
                  {dictionary.companies.labels.eventType}
                </FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (!isPathCompanyEventType(value)) {
                      return
                    }

                    field.handleChange(value)
                  }}
                  disabled={isSaving || isDeleting}
                >
                  <SelectTrigger id={`event-details-type-${event.id}`} aria-invalid={isInvalid}>
                    <SelectValue placeholder={dictionary.companies.placeholders.selectEventType} />
                  </SelectTrigger>
                  <SelectContent>
                    {pathCompanyEventTypeOptions.map((eventType) => (
                      <SelectItem key={eventType} value={eventType}>
                        {dictionary.companies.eventTypes[eventType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="effectiveDate">
          {(field) => {
            const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={`event-details-date-${event.id}`}>
                  {dictionary.companies.labels.effectiveDate}
                </FieldLabel>
                <SingleDatePickerField
                  id={`event-details-date-${event.id}`}
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

        <form.Field name="amount">
          {(field) => {
            const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={`event-details-amount-${event.id}`}>
                  {dictionary.companies.labels.amount}
                </FieldLabel>
                <NumberStepperInput
                  id={`event-details-amount-${event.id}`}
                  name={field.name}
                  value={field.state.value}
                  min={0}
                  step={compensationRateStep}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  ariaInvalid={isInvalid}
                  disabled={isSaving || isDeleting}
                />
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="notes">
          {(field) => {
            const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={`event-details-notes-${event.id}`}>
                  {dictionary.companies.labels.notes}
                </FieldLabel>
                <Textarea
                  id={`event-details-notes-${event.id}`}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(eventChange) => field.handleChange(eventChange.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={dictionary.companies.placeholders.notes}
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
              {dictionary.companies.actions.deleteEvent}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dictionary.companies.dialogs.deleteEventTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {dictionary.companies.dialogs.deleteEventDescription}
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
                {dictionary.companies.actions.deleteEvent}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
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
