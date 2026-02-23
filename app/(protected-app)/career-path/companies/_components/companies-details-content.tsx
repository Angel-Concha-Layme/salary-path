"use client"

import type {
  PathCompanyEventsEntity,
  PathCompanyEventsUpdateInput,
} from "@/app/lib/models/personal-path/path-company-events.model"
import type {
  PathCompaniesEntity,
  PathCompaniesUpdateInput,
} from "@/app/lib/models/personal-path/path-companies.model"
import { CompanyDetailsForm } from "@/app/(protected-app)/career-path/companies/_components/company-details-form"
import { EventDetailsForm } from "@/app/(protected-app)/career-path/companies/_components/event-details-form"

interface CompaniesDetailsContentProps {
  selectedCompany: PathCompaniesEntity | null
  selectedEventId: string | null
  selectedEvent: PathCompanyEventsEntity | null
  isEventsLoading: boolean
  emptyMessage: string
  onUpdateCompany: (input: PathCompaniesUpdateInput) => Promise<void>
  onDeleteCompany: () => Promise<void>
  onUpdateEvent: (input: PathCompanyEventsUpdateInput) => Promise<void>
  onDeleteEvent: () => Promise<void>
  isCompanySaving: boolean
  isCompanyDeleting: boolean
  isEventSaving: boolean
  isEventDeleting: boolean
}

function renderEmptyState(message: string) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-background px-3 py-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function CompaniesDetailsContent({
  selectedCompany,
  selectedEventId,
  selectedEvent,
  isEventsLoading,
  emptyMessage,
  onUpdateCompany,
  onDeleteCompany,
  onUpdateEvent,
  onDeleteEvent,
  isCompanySaving,
  isCompanyDeleting,
  isEventSaving,
  isEventDeleting,
}: CompaniesDetailsContentProps) {
  if (!selectedCompany) {
    return renderEmptyState(emptyMessage)
  }

  if (selectedEventId && !selectedEvent && isEventsLoading) {
    return null
  }

  if (selectedEvent) {
    return (
      <EventDetailsForm
        key={selectedEvent.id}
        event={selectedEvent}
        compensationType={selectedCompany.compensationType}
        currency={selectedCompany.currency}
        onSubmit={onUpdateEvent}
        onDelete={onDeleteEvent}
        isSaving={isEventSaving}
        isDeleting={isEventDeleting}
      />
    )
  }

  return (
    <CompanyDetailsForm
      key={selectedCompany.id}
      company={selectedCompany}
      onSubmit={onUpdateCompany}
      onDelete={onDeleteCompany}
      isSaving={isCompanySaving}
      isDeleting={isCompanyDeleting}
    />
  )
}
