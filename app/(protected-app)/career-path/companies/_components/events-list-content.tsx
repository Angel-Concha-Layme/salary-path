"use client"

import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import { cn } from "@/lib/utils"

interface EventsListContentProps {
  events: PathCompanyEventsEntity[]
  selectedEventId: string | null
  selectedCompanyId: string | null
  selectedCompanyCurrency: string
  dateFormatter: Intl.DateTimeFormat
  locale: string
  isLoading: boolean
  error: unknown
  emptyNoCompanyMessage: string
  emptyEventsMessage: string
  unknownErrorMessage: string
  getEventTypeLabel: (eventType: PathCompanyEventsEntity["eventType"]) => string
  onSelectEvent: (eventId: string) => void
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function formatAmount(locale: string, currency: string, amount: number) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function renderEmptyState(message: string) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-background px-3 py-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function EventsListContent({
  events,
  selectedEventId,
  selectedCompanyId,
  selectedCompanyCurrency,
  dateFormatter,
  locale,
  isLoading,
  error,
  emptyNoCompanyMessage,
  emptyEventsMessage,
  unknownErrorMessage,
  getEventTypeLabel,
  onSelectEvent,
}: EventsListContentProps) {
  if (!selectedCompanyId) {
    return renderEmptyState(emptyNoCompanyMessage)
  }

  if (isLoading) {
    return null
  }

  if (error) {
    return <p className="text-sm text-destructive">{getErrorMessage(error, unknownErrorMessage)}</p>
  }

  if (events.length === 0) {
    return renderEmptyState(emptyEventsMessage)
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const isSelected = event.id === selectedEventId

        return (
          <button
            key={event.id}
            type="button"
            onClick={() => onSelectEvent(event.id)}
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-left transition-colors hover:border-border/80 hover:bg-accent/30",
              isSelected ? "border-foreground/30 bg-background" : "border-border/80 bg-background"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={cn("text-sm font-medium", isSelected && "text-foreground")}>
                {getEventTypeLabel(event.eventType)}
              </p>
              <p className={cn("text-xs text-muted-foreground", isSelected && "text-foreground/75")}>
                {formatAmount(locale, selectedCompanyCurrency, event.amount)}
              </p>
            </div>
            <p className={cn("mt-1 text-xs text-muted-foreground", isSelected && "text-foreground/70")}>
              {dateFormatter.format(new Date(event.effectiveDate))}
            </p>
          </button>
        )
      })}
    </div>
  )
}
