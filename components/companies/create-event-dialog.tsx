"use client"

import { useMemo, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useStore } from "@tanstack/react-store"
import { z } from "zod"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { getCompensationRateStep } from "@/app/lib/models/onboarding/onboarding-form.model"
import type {
  PathCompanyEventsCreateInput,
  PathCompanyEventsEntity,
} from "@/app/lib/models/personal-path/path-company-events.model"
import { pathCompanyEventTypeOptions } from "@/app/lib/models/personal-path/path-company-events.model"
import { NumberStepperInput } from "@/components/onboarding/number-stepper-input"
import { SingleDatePickerField } from "@/components/shared/single-date-picker-field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface CreateEventDialogProps {
  canCreate: boolean
  compensationType: "hourly" | "monthly"
  currency: string
  onCreate: (input: PathCompanyEventsCreateInput) => Promise<void>
  isPending?: boolean
}

interface CreateEventFormValues {
  eventType: PathCompanyEventsEntity["eventType"]
  effectiveDate: Date | null
  amount: number
  notes: string
}

const defaultValues: CreateEventFormValues = {
  eventType: "rate_increase",
  effectiveDate: null,
  amount: 0,
  notes: "",
}

export function CreateEventDialog({
  canCreate,
  compensationType,
  currency,
  onCreate,
  isPending = false,
}: CreateEventDialogProps) {
  const { dictionary } = useDictionary()
  const [open, setOpen] = useState(false)
  const actualOpen = canCreate && open
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

      await onCreate({
        eventType: value.eventType,
        effectiveDate: value.effectiveDate.toISOString(),
        amount: value.amount,
        notes: normalizedNotes.length ? normalizedNotes : null,
      })

      form.reset(defaultValues)
      setOpen(false)
    },
  })

  const formValues = useStore(form.store, () => form.state.values)
  const isFormSubmitting = useStore(form.store, () => form.state.isSubmitting)

  const canCreateEvent = formValues.effectiveDate !== null && formValues.amount >= 0

  return (
    <Dialog
      open={actualOpen}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          form.reset(defaultValues)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" disabled={!canCreate || isPending} className="hover:bg-primary/90">
          {dictionary.companies.actions.addEvent}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dictionary.companies.dialogs.addEventTitle}</DialogTitle>
          <DialogDescription>{dictionary.companies.dialogs.addEventDescription}</DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="eventType">
              {(field) => {
                const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="create-event-type">{dictionary.companies.labels.eventType}</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as PathCompanyEventsEntity["eventType"])
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger id="create-event-type" aria-invalid={isInvalid}>
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
                    <FieldLabel htmlFor="create-event-date">{dictionary.companies.labels.effectiveDate}</FieldLabel>
                    <SingleDatePickerField
                      id="create-event-date"
                      value={field.state.value}
                      onChange={field.handleChange}
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

            <form.Field name="amount">
              {(field) => {
                const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="create-event-amount">{dictionary.companies.labels.amount}</FieldLabel>
                    <NumberStepperInput
                      id="create-event-amount"
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

            <form.Field name="notes">
              {(field) => {
                const isInvalid = field.state.meta.isBlurred && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="create-event-notes">{dictionary.companies.labels.notes}</FieldLabel>
                    <Textarea
                      id="create-event-notes"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(eventChange) => field.handleChange(eventChange.target.value)}
                      aria-invalid={isInvalid}
                      placeholder={dictionary.companies.placeholders.notes}
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
              disabled={!canCreateEvent || isFormSubmitting || isPending}
            >
              {dictionary.companies.actions.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
