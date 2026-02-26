"use client"

import { useState } from "react"
import { InfoIcon } from "lucide-react"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import type {
  PathCompaniesEntity,
  PathCompaniesUpdateInput,
} from "@/app/lib/models/personal-path/path-companies.model"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CompanyReviewDialogProps {
  company: PathCompaniesEntity | null
  onSubmit: (input: PathCompaniesUpdateInput) => Promise<void>
  disabled?: boolean
}

export function CompanyReviewDialog({
  company,
  onSubmit,
  disabled = false,
}: CompanyReviewDialogProps) {
  const { dictionary } = useDictionary()
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(company?.score ?? 5)
  const [review, setReview] = useState(company?.review ?? "")

  const isBusy = disabled || !company

  const isDirty = company ? score !== company.score || review !== company.review : false

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setScore(company?.score ?? 5)
          setReview(company?.review ?? "")
        }
        setOpen(nextOpen)
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" disabled={isBusy} className="hover:bg-primary/90">
          {dictionary.companies.actions.addReview}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{dictionary.companies.dialogs.addReviewTitle}</DialogTitle>
          <DialogDescription>{dictionary.companies.dialogs.addReviewDescription}</DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel>
            {dictionary.companies.labels.score}: {score}
          </FieldLabel>
          <div className="flex h-8 items-center">
            <Slider
              min={1}
              max={10}
              step={1}
              value={[score]}
              onValueChange={(nextValues) => {
                const next = nextValues[0]
                if (typeof next !== "number") {
                  return
                }

                setScore(next)
              }}
              disabled={isBusy}
            />
          </div>
        </Field>

        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="company-review-dialog-review">
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
            id="company-review-dialog-review"
            value={review}
            onChange={(eventChange) => setReview(eventChange.target.value)}
            placeholder={dictionary.companies.placeholders.review}
            disabled={isBusy}
          />
        </Field>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false)
            }}
            disabled={isBusy}
          >
            {dictionary.companies.actions.cancel}
          </Button>
          <Button
            type="button"
            onClick={async () => {
              if (!company) {
                return
              }

              await onSubmit({
                score,
                review: review.trim(),
              })
              setOpen(false)
            }}
            disabled={isBusy || !isDirty}
          >
            {dictionary.companies.actions.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
