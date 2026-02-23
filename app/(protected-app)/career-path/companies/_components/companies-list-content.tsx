"use client"

import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"
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
}: CompaniesListContentProps) {
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
          <button
            key={company.id}
            type="button"
            onClick={() => onSelectCompany(company.id)}
            className={cn(
              "w-full cursor-pointer rounded-lg border border-border/80 px-3 py-2 text-left transition-colors hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_16%,transparent)]",
              isSelected
                ? "bg-[color-mix(in_oklch,var(--ui-accent-current)_22%,transparent)]"
                : "bg-background"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={cn("truncate text-sm font-medium", isSelected && "text-foreground")}>
                  {company.displayName}
                </p>
                <p className={cn("truncate text-xs text-muted-foreground", isSelected && "text-foreground/75")}>
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
        )
      })}
    </div>
  )
}
