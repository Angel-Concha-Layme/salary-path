"use client"

import { ArrowRightIcon } from "lucide-react"

import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CompaniesListContentProps {
  companies: PathCompaniesEntity[]
  selectedCompanyId: string | null
  dateFormatter: Intl.DateTimeFormat
  isLoading: boolean
  error: unknown
  emptyMessage: string
  unknownErrorMessage: string
  onSelectCompany: (companyId: string) => void
  showDetailsAction?: boolean
  viewDetailsLabel?: string
  onViewDetails?: (companyId: string) => void
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function renderEmptyState(message: string) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-background px-3 py-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function CompaniesListContent({
  companies,
  selectedCompanyId,
  dateFormatter,
  isLoading,
  error,
  emptyMessage,
  unknownErrorMessage,
  onSelectCompany,
  showDetailsAction = false,
  viewDetailsLabel,
  onViewDetails,
}: CompaniesListContentProps) {
  const canViewDetails = showDetailsAction && Boolean(viewDetailsLabel) && Boolean(onViewDetails)
  const detailsLabel = viewDetailsLabel ?? ""

  if (isLoading) {
    return null
  }

  if (error) {
    return <p className="text-sm text-destructive">{getErrorMessage(error, unknownErrorMessage)}</p>
  }

  if (companies.length === 0) {
    return renderEmptyState(emptyMessage)
  }

  return (
    <div className="space-y-2">
      {companies.map((company) => {
        const isSelected = company.id === selectedCompanyId
        const startDate = dateFormatter.format(new Date(company.startDate))
        const endDate = company.endDate ? dateFormatter.format(new Date(company.endDate)) : null

        return (
          <div
            key={company.id}
            className={cn(
              "w-full rounded-lg bg-background/75 px-3 py-2 transition-colors hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_16%,transparent)] md:border md:border-border/80",
              isSelected
                ? "bg-[color-mix(in_oklch,var(--ui-accent-current)_22%,transparent)] md:bg-[color-mix(in_oklch,var(--ui-accent-current)_22%,transparent)]"
                : "bg-background md:bg-background"
            )}
          >
            <button
              type="button"
              onClick={() => onSelectCompany(company.id)}
              className="w-full cursor-pointer text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn("truncate text-sm font-medium", isSelected && "text-foreground")}>
                    {company.displayName}
                  </p>
                  <p
                    className={cn(
                      "truncate text-xs text-muted-foreground",
                      isSelected && "text-foreground/75"
                    )}
                  >
                    {company.roleDisplayName}
                  </p>
                </div>
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-border/80"
                  style={{ backgroundColor: company.color }}
                />
              </div>
              <p className={cn("mt-1 text-xs text-muted-foreground", isSelected && "text-foreground/70")}>
                {endDate ? `${startDate} - ${endDate}` : startDate}
              </p>
            </button>

            {canViewDetails ? (
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-md border border-[color-mix(in_oklch,var(--ui-accent-current)_42%,var(--border))] bg-[color-mix(in_oklch,var(--ui-accent-current)_64%,black)] px-3 text-xs font-semibold text-white hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_70%,black)]"
                  onClick={() => onViewDetails?.(company.id)}
                >
                  {detailsLabel}
                  <ArrowRightIcon className="size-3.5" />
                </Button>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
