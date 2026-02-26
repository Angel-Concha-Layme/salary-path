"use client"

import { Fragment, useCallback, useRef, useState } from "react"
import { ChevronDownIcon, InfoIcon } from "lucide-react"
import { toast } from "sonner"

import {
  useCreateMonthlyIncomeSourceMutation,
  useDeleteMonthlyIncomeSourceMutation,
  useUpdateMonthlyIncomeSourceMutation,
} from "@/app/hooks/finance/use-monthly-income"
import { normalizeNonNegativeAmountInput, selectInputOnZeroFocus } from "@/app/lib/input-utils"
import type {
  MonthlyIncomeCurrencyBucket,
  MonthlyIncomeSource,
  MonthlyIncomeSourceType,
} from "@/app/lib/models/finance/monthly-income.model"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import {
  type SourceFormState,
  formatAmount,
  formatMonthKey,
  isMonthOlderThanOne,
  sourceTypeSortWeight,
} from "./personal-path-formatters"

interface MonthlyIncomeTableLabels {
  tableTitle: string
  saving: string
  emptyTable: string
  emptySources: string
  yearFilter: { allYears: string }
  labels: {
    month: string
    employment: string
    bonus: string
    extraIncome: string
    adjustment: string
    final: string
    computed: string
  }
  tooltips: {
    bonus: string
    extraIncome: string
    adjustment: string
  }
  sourceTypes: Record<string, string>
  actions: {
    addBonus: string
    addExtraIncome: string
    editAdjustment: string
    editOverride: string
    clearOverride: string
    edit: string
    delete: string
  }
  form: {
    amountLabel: string
    noteLabel: string
    notePlaceholder: string
    save: string
    cancel: string
  }
  toasts: { saved: string }
  oldMonthWarning: string
  deleteConfirm: string
  confirmDialog: {
    title: string
    cancel: string
    confirm: string
  }
}

interface MonthlyIncomeTablePanelProps {
  items: MonthlyIncomeCurrencyBucket[]
  selectedYear: string
  onSelectedYearChange: (year: string) => void
  availableYears: string[]
  locale: string
  labels: MonthlyIncomeTableLabels
  unknownErrorLabel: string
  errorMessage?: string | null
}

function HelpTooltip({ text }: { text?: string }) {
  if (!text) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="h-5 w-5 rounded-full text-primary/70 hover:text-primary"
          aria-label={text}
        >
          <InfoIcon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{text}</TooltipContent>
    </Tooltip>
  )
}

export function MonthlyIncomeTablePanel({
  items,
  selectedYear,
  onSelectedYearChange,
  availableYears,
  locale,
  labels,
  unknownErrorLabel,
  errorMessage,
}: MonthlyIncomeTablePanelProps) {
  const [expandedMonthlyRows, setExpandedMonthlyRows] = useState<string[]>([])
  const [sourceFormState, setSourceFormState] = useState<SourceFormState | null>(null)
  const [confirmDialogMessage, setConfirmDialogMessage] = useState<string | null>(null)
  const confirmResolveRef = useRef<((confirmed: boolean) => void) | null>(null)

  const createMutation = useCreateMonthlyIncomeSourceMutation()
  const updateMutation = useUpdateMonthlyIncomeSourceMutation()
  const deleteMutation = useDeleteMonthlyIncomeSourceMutation()

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const showConfirmDialog = useCallback((message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      confirmResolveRef.current = resolve
      setConfirmDialogMessage(message)
    })
  }, [])

  const handleConfirmDialogClose = useCallback((confirmed: boolean) => {
    confirmResolveRef.current?.(confirmed)
    confirmResolveRef.current = null
    setConfirmDialogMessage(null)
  }, [])

  async function ensureHistoricalWarning(month: string): Promise<boolean> {
    if (!isMonthOlderThanOne(month)) {
      return true
    }

    return showConfirmDialog(
      labels.oldMonthWarning.replace("{month}", formatMonthKey(month, locale))
    )
  }

  function toggleMonthlyRow(month: string, currency: string) {
    const key = `${month}|${currency}`
    setExpandedMonthlyRows((current) =>
      current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key]
    )
  }

  function openSourceForm(
    bucket: MonthlyIncomeCurrencyBucket,
    mode: "create" | "edit",
    sourceType: MonthlyIncomeSourceType,
    source?: MonthlyIncomeSource
  ) {
    const key = `${bucket.month}|${bucket.currency}`

    if (!expandedMonthlyRows.includes(key)) {
      setExpandedMonthlyRows((current) => [...current, key])
    }

    setSourceFormState({
      bucketKey: key,
      mode,
      sourceType,
      sourceId: source?.id ?? null,
      amount: source?.finalAmount ?? 0,
      note: source?.note ?? "",
    })
  }

  function closeSourceForm() {
    setSourceFormState(null)
  }

  async function submitSourceForm(bucket: MonthlyIncomeCurrencyBucket) {
    if (!sourceFormState) return
    if (!(await ensureHistoricalWarning(bucket.month))) return

    const note = sourceFormState.note.trim().length ? sourceFormState.note.trim() : null

    try {
      if (sourceFormState.mode === "create") {
        await createMutation.mutateAsync({
          month: bucket.month,
          currency: bucket.currency,
          sourceType: sourceFormState.sourceType as Exclude<MonthlyIncomeSourceType, "employment">,
          amount: sourceFormState.amount,
          note,
        })
      } else if (sourceFormState.sourceId) {
        await updateMutation.mutateAsync({
          sourceId: sourceFormState.sourceId,
          input: { finalAmount: sourceFormState.amount, note },
        })
      }
      toast.success(labels.toasts.saved)
      closeSourceForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : unknownErrorLabel)
    }
  }

  async function clearEmploymentOverride(
    bucket: MonthlyIncomeCurrencyBucket,
    source: MonthlyIncomeSource
  ) {
    if (!(await ensureHistoricalWarning(bucket.month))) return

    try {
      await updateMutation.mutateAsync({
        sourceId: source.id,
        input: { clearOverride: true },
      })
      toast.success(labels.toasts.saved)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : unknownErrorLabel)
    }
  }

  async function deleteManualSource(bucket: MonthlyIncomeCurrencyBucket, source: MonthlyIncomeSource) {
    if (!(await ensureHistoricalWarning(bucket.month))) return
    if (!(await showConfirmDialog(labels.deleteConfirm))) return

    try {
      await deleteMutation.mutateAsync(source.id)
      toast.success(labels.toasts.saved)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : unknownErrorLabel)
    }
  }

  return (
    <>
      <article className="w-full max-w-full overflow-hidden rounded-xl border border-border/80 bg-background text-card-foreground">
        <header className="flex items-center justify-between gap-2 border-b border-border/70 bg-background px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
            {labels.tableTitle}
          </h2>
          <div className="flex items-center gap-2">
            {isMutating ? (
              <span className="text-xs text-muted-foreground">{labels.saving}</span>
            ) : null}
            <Select value={selectedYear} onValueChange={onSelectedYearChange}>
              <SelectTrigger className="h-7 w-auto min-w-[100px] border-border/70 bg-background text-xs shadow-none [&_svg]:text-primary/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.yearFilter.allYears}</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {errorMessage ? (
          <div className="p-3">
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="p-3">
            <p className="rounded-lg border border-dashed border-border/70 bg-background px-3 py-4 text-sm text-muted-foreground">
              {labels.emptyTable}
            </p>
          </div>
        ) : (
          <TooltipProvider delayDuration={150}>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-background text-xs uppercase tracking-[0.08em] text-foreground">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      {labels.labels.month}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      {labels.labels.employment}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      <span className="inline-flex items-center gap-1">
                        {labels.labels.bonus}
                        <HelpTooltip text={labels.tooltips.bonus} />
                      </span>
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      <span className="inline-flex items-center gap-1">
                        {labels.labels.extraIncome}
                        <HelpTooltip text={labels.tooltips.extraIncome} />
                      </span>
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      <span className="inline-flex items-center gap-1">
                        {labels.labels.adjustment}
                        <HelpTooltip text={labels.tooltips.adjustment} />
                      </span>
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      {labels.labels.final}
                    </th>
                    <th className="w-8 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((bucket) => {
                    const key = `${bucket.month}|${bucket.currency}`
                    const isExpanded = expandedMonthlyRows.includes(key)
                    const sortedSources = [...bucket.sources].sort(
                      (left, right) =>
                        sourceTypeSortWeight(left.sourceType) - sourceTypeSortWeight(right.sourceType)
                    )
                    const isFormActiveHere = sourceFormState?.bucketKey === key

                    return (
                      <Fragment key={key}>
                        <tr
                          className={cn(
                            "cursor-pointer border-t border-border/70 align-middle transition-colors hover:bg-accent/40",
                            isExpanded && "bg-accent/10"
                          )}
                          onClick={() => toggleMonthlyRow(bucket.month, bucket.currency)}
                        >
                          <td className="whitespace-nowrap px-3 py-2 font-medium">
                            {formatMonthKey(bucket.month, locale)}
                            <span className="ml-1.5 text-muted-foreground">{bucket.currency}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                            {formatAmount(locale, bucket.currency, bucket.totals.employmentFinal, 2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                            {formatAmount(locale, bucket.currency, bucket.totals.bonus, 2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                            {formatAmount(locale, bucket.currency, bucket.totals.extraIncome, 2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                            {formatAmount(locale, bucket.currency, bucket.totals.adjustment, 2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums">
                            {formatAmount(locale, bucket.currency, bucket.totals.final, 2)}
                          </td>
                          <td className="px-2 py-2">
                            <ChevronDownIcon
                              className={cn("size-4 text-primary/70 transition-transform", isExpanded && "rotate-180")}
                            />
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr>
                            <td colSpan={7} className="border-t border-border/60 bg-background/50 px-3 py-2">
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 border-primary/40 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                                  disabled={isMutating}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    openSourceForm(bucket, "create", "bonus")
                                  }}
                                >
                                  {labels.actions.addBonus}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 border-primary/40 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                                  disabled={isMutating}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    openSourceForm(bucket, "create", "extra_income")
                                  }}
                                >
                                  {labels.actions.addExtraIncome}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 border-primary/40 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                                  disabled={isMutating}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    const adjustmentSource = bucket.sources.find(
                                      (source) => source.sourceType === "adjustment"
                                    )
                                    if (adjustmentSource) {
                                      openSourceForm(bucket, "edit", "adjustment", adjustmentSource)
                                    } else {
                                      openSourceForm(bucket, "create", "adjustment")
                                    }
                                  }}
                                >
                                  {labels.actions.editAdjustment}
                                </Button>
                              </div>

                              {sortedSources.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  {labels.emptySources}
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {sortedSources.map((source) => (
                                    <div
                                      key={source.id}
                                      className="min-w-[160px] flex-1 rounded-md border border-border/70 bg-background px-2 py-2"
                                    >
                                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        {labels.sourceTypes[source.sourceType]}
                                      </p>
                                      {source.companyName ? (
                                        <p className="truncate text-xs text-muted-foreground">{source.companyName}</p>
                                      ) : null}
                                      <p className="mt-1 text-sm font-semibold tabular-nums">
                                        {formatAmount(locale, source.currency, source.finalAmount, 2)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {labels.labels.computed}:{" "}
                                        {formatAmount(locale, source.currency, source.computedAmount, 2)}
                                      </p>

                                      {source.note?.trim().length ? (
                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{source.note}</p>
                                      ) : null}

                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {source.sourceType === "employment" ? (
                                          <>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="h-7 border-primary/40 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                                              disabled={isMutating}
                                              onClick={(event) => {
                                                event.stopPropagation()
                                                openSourceForm(bucket, "edit", "employment", source)
                                              }}
                                            >
                                              {labels.actions.editOverride}
                                            </Button>
                                            {source.isUserEdited ? (
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="h-7 border-primary/40 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                                                disabled={isMutating}
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  void clearEmploymentOverride(bucket, source)
                                                }}
                                              >
                                                {labels.actions.clearOverride}
                                              </Button>
                                            ) : null}
                                          </>
                                        ) : (
                                          <>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="h-7 border-primary/40 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                                              disabled={isMutating}
                                              onClick={(event) => {
                                                event.stopPropagation()
                                                openSourceForm(bucket, "edit", source.sourceType, source)
                                              }}
                                            >
                                              {labels.actions.edit}
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="destructive"
                                              className="h-7 cursor-pointer px-2 text-xs"
                                              disabled={isMutating}
                                              onClick={(event) => {
                                                event.stopPropagation()
                                                void deleteManualSource(bucket, source)
                                              }}
                                            >
                                              {labels.actions.delete}
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {isFormActiveHere && sourceFormState ? (
                                <div className="mt-2 rounded-md border border-primary/30 bg-background p-3">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    {sourceFormState.mode === "create" ? "+" : ""}{" "}
                                    {labels.sourceTypes[sourceFormState.sourceType]}
                                  </p>
                                  <div className="flex flex-wrap items-end gap-2">
                                    <div className="min-w-[120px] space-y-1">
                                      <label className="text-xs text-muted-foreground">
                                        {labels.form.amountLabel}
                                      </label>
                                      <InputGroup>
                                        <InputGroupInput
                                          type="number"
                                          step="0.01"
                                          value={sourceFormState.amount}
                                          onFocus={selectInputOnZeroFocus(sourceFormState.amount)}
                                          onChange={(event) => {
                                            const normalizedValue = normalizeNonNegativeAmountInput(
                                              event.target.value
                                            )
                                            if (normalizedValue === null) {
                                              return
                                            }

                                            setSourceFormState((prev) =>
                                              prev
                                                ? {
                                                    ...prev,
                                                    amount:
                                                      normalizedValue === ""
                                                        ? 0
                                                        : Number(normalizedValue),
                                                  }
                                                : null
                                            )
                                          }}
                                          onClick={(event) => event.stopPropagation()}
                                        />
                                      </InputGroup>
                                    </div>
                                    <div className="min-w-[160px] flex-1 space-y-1">
                                      <label className="text-xs text-muted-foreground">
                                        {labels.form.noteLabel}
                                      </label>
                                      <Input
                                        type="text"
                                        placeholder={labels.form.notePlaceholder}
                                        value={sourceFormState.note}
                                        onChange={(event) =>
                                          setSourceFormState((prev) =>
                                            prev ? { ...prev, note: event.target.value } : null
                                          )
                                        }
                                        onClick={(event) => event.stopPropagation()}
                                      />
                                    </div>
                                    <div className="flex gap-1.5">
                                      <Button
                                        size="sm"
                                        className="h-8"
                                        disabled={isMutating}
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          void submitSourceForm(bucket)
                                        }}
                                      >
                                        {labels.form.save}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          closeSourceForm()
                                        }}
                                      >
                                        {labels.form.cancel}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        )}
      </article>

      <AlertDialog
        open={confirmDialogMessage !== null}
        onOpenChange={(open) => {
          if (!open) handleConfirmDialogClose(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {labels.confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirmDialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConfirmDialogClose(false)}>
              {labels.confirmDialog.cancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmDialogClose(true)}>
              {labels.confirmDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
