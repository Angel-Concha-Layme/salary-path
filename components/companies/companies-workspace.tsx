"use client"

import { useMemo, useState } from "react"

import {
  useCreatePathCompanyMutation,
  useDeletePathCompanyMutation,
  usePathCompaniesListQuery,
  useUpdatePathCompanyMutation,
} from "@/app/hooks/personal-path/use-path-companies"
import {
  useCreatePathCompanyEventMutation,
  useDeletePathCompanyEventMutation,
  usePathCompanyEventsByOwnerListQuery,
  useUpdatePathCompanyEventMutation,
} from "@/app/hooks/personal-path/use-path-company-events"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import type {
  PathCompanyEventsCreateInput,
  PathCompanyEventsUpdateInput,
} from "@/app/lib/models/personal-path/path-company-events.model"
import type {
  PathCompaniesCreateInput,
  PathCompaniesUpdateInput,
} from "@/app/lib/models/personal-path/path-companies.model"
import { notificationService } from "@/components/notifications/notification-service"
import { CompanyDetailsForm } from "@/components/companies/company-details-form"
import { CreateCompanyDialog } from "@/components/companies/create-company-dialog"
import { CreateEventDialog } from "@/components/companies/create-event-dialog"
import { EventDetailsForm } from "@/components/companies/event-details-form"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type MobileTab = "companies" | "events" | "details"
type CompaniesSortOrder = "newest_first" | "oldest_first"

const COMPANIES_SORT_ORDER_STORAGE_KEY = "salary-path:companies-sort-order"

function normalizeCompaniesSortOrder(value: string | null): CompaniesSortOrder {
  return value === "oldest_first" ? "oldest_first" : "newest_first"
}

interface CreateCompanySubmission {
  company: PathCompaniesCreateInput
  initialRate: number
  finalRate: number | null
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

interface ColumnPanelProps {
  title: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

function ColumnPanel({ title, action, className, children }: ColumnPanelProps) {
  return (
    <section
      className={cn(
        "flex min-h-[500px] flex-col rounded-xl border border-border/80 bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <header className="flex min-h-[60px] items-center justify-between gap-3 border-b border-border/70 bg-primary/5 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary/80">{title}</h2>
        {action}
      </header>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </section>
  )
}

export function CompaniesWorkspace() {
  const { dictionary, locale } = useDictionary()

  const [selectedCompanyIdState, setSelectedCompanyId] = useState<string | null>(null)
  const [selectedEventIdState, setSelectedEventId] = useState<string | null>(null)
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("companies")
  const [companiesSortOrder, setCompaniesSortOrder] = useState<CompaniesSortOrder>(() => {
    if (typeof window === "undefined") {
      return "newest_first"
    }

    try {
      return normalizeCompaniesSortOrder(window.localStorage.getItem(COMPANIES_SORT_ORDER_STORAGE_KEY))
    } catch {
      return "newest_first"
    }
  })
  const sortDirection = companiesSortOrder === "oldest_first" ? 1 : -1

  const companiesQuery = usePathCompaniesListQuery({ limit: 100 })
  const companies = useMemo(() => {
    const items = companiesQuery.data?.items ?? []
    return [...items].sort((left, right) => {
      const byStartDate =
        (new Date(left.startDate).getTime() - new Date(right.startDate).getTime()) * sortDirection
      if (byStartDate !== 0) {
        return byStartDate
      }

      return (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * sortDirection
    })
  }, [companiesQuery.data?.items, sortDirection])

  const selectedCompanyId = useMemo(() => {
    if (companies.length === 0) {
      return null
    }

    if (selectedCompanyIdState && companies.some((company) => company.id === selectedCompanyIdState)) {
      return selectedCompanyIdState
    }

    return companies[0]?.id ?? null
  }, [companies, selectedCompanyIdState])

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  )

  const companyEventsQuery = usePathCompanyEventsByOwnerListQuery({ limit: 100 })
  const events = useMemo(() => {
    if (!selectedCompanyId) {
      return []
    }

    const allEvents = companyEventsQuery.data?.items ?? []
    return allEvents
      .filter((event) => event.pathCompanyId === selectedCompanyId)
      .sort((left, right) => {
        const byEffectiveDate =
          (new Date(left.effectiveDate).getTime() - new Date(right.effectiveDate).getTime()) *
          sortDirection
        if (byEffectiveDate !== 0) {
          return byEffectiveDate
        }

        return (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * sortDirection
      })
  }, [companyEventsQuery.data?.items, selectedCompanyId, sortDirection])

  const selectedEventId = useMemo(() => {
    if (!selectedEventIdState) {
      return null
    }

    if (events.some((event) => event.id === selectedEventIdState)) {
      return selectedEventIdState
    }

    return null
  }, [events, selectedEventIdState])

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  )

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit", year: "numeric" }),
    [locale]
  )

  const createCompanyMutation = useCreatePathCompanyMutation()
  const updateCompanyMutation = useUpdatePathCompanyMutation()
  const deleteCompanyMutation = useDeletePathCompanyMutation()

  const createEventMutation = useCreatePathCompanyEventMutation()
  const updateEventMutation = useUpdatePathCompanyEventMutation()
  const deleteEventMutation = useDeletePathCompanyEventMutation()

  const handleCompaniesSortOrderChange = (value: string) => {
    const nextOrder = normalizeCompaniesSortOrder(value)
    setCompaniesSortOrder(nextOrder)

    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(COMPANIES_SORT_ORDER_STORAGE_KEY, nextOrder)
    } catch {
      // Ignore storage write errors (private mode, blocked storage, etc.).
    }
  }

  async function handleCreateCompany(input: CreateCompanySubmission) {
    const created = await notificationService.promise(
      (async () => {
        const createdCompany = await createCompanyMutation.mutateAsync(input.company)

        await createEventMutation.mutateAsync({
          pathCompanyId: createdCompany.id,
          input: {
            eventType: "start_rate",
            effectiveDate: input.company.startDate,
            amount: input.initialRate,
            notes: null,
          },
        })

        if (input.finalRate !== null) {
          await createEventMutation.mutateAsync({
            pathCompanyId: createdCompany.id,
            input: {
              eventType: "rate_increase",
              effectiveDate: input.company.endDate ?? input.company.startDate,
              amount: input.finalRate,
              notes: null,
            },
          })
        }

        return createdCompany
      })(),
      {
        loading: dictionary.companies.notifications.createCompanyLoading,
        success: dictionary.companies.notifications.createCompanySuccess,
        error: dictionary.companies.notifications.createCompanyError,
      }
    )

    setSelectedCompanyId(created.id)
    setSelectedEventId(null)
    setActiveMobileTab("events")
  }

  async function handleCreateEvent(input: PathCompanyEventsCreateInput) {
    if (!selectedCompanyId) {
      return
    }

    const created = await notificationService.promise(
      createEventMutation.mutateAsync({
        pathCompanyId: selectedCompanyId,
        input,
      }),
      {
        loading: dictionary.companies.notifications.createEventLoading,
        success: dictionary.companies.notifications.createEventSuccess,
        error: dictionary.companies.notifications.createEventError,
      }
    )

    setSelectedEventId(created.id)
    setActiveMobileTab("details")
  }

  async function handleUpdateCompany(input: PathCompaniesUpdateInput) {
    if (!selectedCompanyId) {
      return
    }

    await notificationService.promise(
      updateCompanyMutation.mutateAsync({
        pathCompanyId: selectedCompanyId,
        input,
      }),
      {
        loading: dictionary.companies.notifications.updateCompanyLoading,
        success: dictionary.companies.notifications.updateCompanySuccess,
        error: dictionary.companies.notifications.updateCompanyError,
      }
    )
  }

  async function handleDeleteCompany() {
    if (!selectedCompanyId) {
      return
    }

    const currentIndex = companies.findIndex((company) => company.id === selectedCompanyId)
    const fallbackCompany = companies[currentIndex + 1] ?? companies[currentIndex - 1] ?? null

    await notificationService.promise(deleteCompanyMutation.mutateAsync(selectedCompanyId), {
      loading: dictionary.companies.notifications.deleteCompanyLoading,
      success: dictionary.companies.notifications.deleteCompanySuccess,
      error: dictionary.companies.notifications.deleteCompanyError,
    })

    setSelectedCompanyId(fallbackCompany?.id ?? null)
    setSelectedEventId(null)
  }

  async function handleUpdateEvent(input: PathCompanyEventsUpdateInput) {
    if (!selectedCompanyId || !selectedEventId) {
      return
    }

    await notificationService.promise(
      updateEventMutation.mutateAsync({
        pathCompanyId: selectedCompanyId,
        eventId: selectedEventId,
        input,
      }),
      {
        loading: dictionary.companies.notifications.updateEventLoading,
        success: dictionary.companies.notifications.updateEventSuccess,
        error: dictionary.companies.notifications.updateEventError,
      }
    )
  }

  async function handleDeleteEvent() {
    if (!selectedCompanyId || !selectedEventId) {
      return
    }

    const currentIndex = events.findIndex((event) => event.id === selectedEventId)
    const fallbackEvent = events[currentIndex + 1] ?? events[currentIndex - 1] ?? null

    await notificationService.promise(
      deleteEventMutation.mutateAsync({
        pathCompanyId: selectedCompanyId,
        eventId: selectedEventId,
      }),
      {
        loading: dictionary.companies.notifications.deleteEventLoading,
        success: dictionary.companies.notifications.deleteEventSuccess,
        error: dictionary.companies.notifications.deleteEventError,
      }
    )

    setSelectedEventId(fallbackEvent?.id ?? null)
  }

  function renderEmptyState(message: string) {
    return (
      <div className="rounded-lg border border-dashed border-primary/35 bg-primary/5 px-3 py-4">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    )
  }

  function renderCompaniesContent() {
    if (companiesQuery.isLoading) {
      return <p className="text-sm text-muted-foreground">{dictionary.common.loading}</p>
    }

    if (companiesQuery.error) {
      return (
        <p className="text-sm text-destructive">
          {getErrorMessage(companiesQuery.error, dictionary.common.unknownError)}
        </p>
      )
    }

    if (companies.length === 0) {
      return renderEmptyState(dictionary.companies.empty.companies)
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
              onClick={() => {
                setSelectedCompanyId(company.id)
                setSelectedEventId(null)
                setActiveMobileTab("events")
              }}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/5",
                isSelected
                  ? "border-primary/40 bg-primary/10 shadow-xs"
                  : "border-border/80 bg-background"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn("truncate text-sm font-medium", isSelected && "text-primary")}>
                    {company.displayName}
                  </p>
                  <p
                    className={cn(
                      "truncate text-xs text-muted-foreground",
                      isSelected && "text-primary/75"
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
              <p className={cn("mt-1 text-xs text-muted-foreground", isSelected && "text-primary/70")}>
                {endDate ? `${startDate} - ${endDate}` : startDate}
              </p>
            </button>
          )
        })}
      </div>
    )
  }

  function renderEventsContent() {
    if (!selectedCompanyId) {
      return renderEmptyState(dictionary.companies.empty.noCompanySelected)
    }

    if (companyEventsQuery.isLoading) {
      return <p className="text-sm text-muted-foreground">{dictionary.common.loading}</p>
    }

    if (companyEventsQuery.error) {
      return (
        <p className="text-sm text-destructive">
          {getErrorMessage(companyEventsQuery.error, dictionary.common.unknownError)}
        </p>
      )
    }

    if (events.length === 0) {
      return renderEmptyState(dictionary.companies.empty.events)
    }

    return (
      <div className="space-y-2">
        {events.map((event) => {
          const isSelected = event.id === selectedEventId

          return (
            <button
              key={event.id}
              type="button"
              onClick={() => {
                setSelectedEventId(event.id)
                setActiveMobileTab("details")
              }}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/5",
                isSelected
                  ? "border-primary/40 bg-primary/10 shadow-xs"
                  : "border-border/80 bg-background"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-sm font-medium", isSelected && "text-primary")}>
                  {dictionary.companies.eventTypes[event.eventType]}
                </p>
                <p className={cn("text-xs text-muted-foreground", isSelected && "text-primary/75")}>
                  {formatAmount(locale, selectedCompany?.currency ?? "USD", event.amount)}
                </p>
              </div>
              <p className={cn("mt-1 text-xs text-muted-foreground", isSelected && "text-primary/70")}>
                {dateFormatter.format(new Date(event.effectiveDate))}
              </p>
            </button>
          )
        })}
      </div>
    )
  }

  function renderDetailsContent() {
    if (!selectedCompany) {
      return renderEmptyState(dictionary.companies.empty.details)
    }

    if (selectedEventId && !selectedEvent && companyEventsQuery.isLoading) {
      return <p className="text-sm text-muted-foreground">{dictionary.common.loading}</p>
    }

    if (selectedEvent) {
      return (
        <EventDetailsForm
          key={selectedEvent.id}
          event={selectedEvent}
          onSubmit={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          isSaving={updateEventMutation.isLoading}
          isDeleting={deleteEventMutation.isLoading}
        />
      )
    }

    return (
      <CompanyDetailsForm
        key={selectedCompany.id}
        company={selectedCompany}
        onSubmit={handleUpdateCompany}
        onDelete={handleDeleteCompany}
        isSaving={updateCompanyMutation.isLoading}
        isDeleting={deleteCompanyMutation.isLoading}
      />
    )
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">{dictionary.companies.title}</h1>
        <p className="text-sm text-muted-foreground">{dictionary.companies.subtitle}</p>
        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary/70">
            {dictionary.companies.order.label}
          </p>
          <Select value={companiesSortOrder} onValueChange={handleCompaniesSortOrderChange}>
            <SelectTrigger size="sm" className="mt-1 w-full max-w-[230px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="newest_first">{dictionary.companies.order.newestFirst}</SelectItem>
              <SelectItem value="oldest_first">{dictionary.companies.order.oldestFirst}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/80 bg-card p-2 shadow-sm md:hidden">
        <Button
          type="button"
          variant={activeMobileTab === "companies" ? "default" : "outline"}
          size="sm"
          className={cn(activeMobileTab === "companies" && "bg-primary text-primary-foreground hover:bg-primary/90")}
          onClick={() => setActiveMobileTab("companies")}
        >
          {dictionary.companies.tabs.companies}
        </Button>
        <Button
          type="button"
          variant={activeMobileTab === "events" ? "default" : "outline"}
          size="sm"
          className={cn(activeMobileTab === "events" && "bg-primary text-primary-foreground hover:bg-primary/90")}
          onClick={() => setActiveMobileTab("events")}
        >
          {dictionary.companies.tabs.events}
        </Button>
        <Button
          type="button"
          variant={activeMobileTab === "details" ? "default" : "outline"}
          size="sm"
          className={cn(activeMobileTab === "details" && "bg-primary text-primary-foreground hover:bg-primary/90")}
          onClick={() => setActiveMobileTab("details")}
        >
          {dictionary.companies.tabs.details}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ColumnPanel
          title={dictionary.companies.columns.companies}
          action={
            <CreateCompanyDialog
              onCreate={handleCreateCompany}
              isPending={createCompanyMutation.isLoading || createEventMutation.isLoading}
            />
          }
          className={activeMobileTab !== "companies" ? "hidden md:flex" : undefined}
        >
          {renderCompaniesContent()}
        </ColumnPanel>

        <ColumnPanel
          title={dictionary.companies.columns.events}
          action={
            <CreateEventDialog
              key={selectedCompanyId ?? "no-company"}
              canCreate={Boolean(selectedCompanyId)}
              onCreate={handleCreateEvent}
              isPending={createEventMutation.isLoading}
            />
          }
          className={activeMobileTab !== "events" ? "hidden md:flex" : undefined}
        >
          {renderEventsContent()}
        </ColumnPanel>

        <ColumnPanel
          title={dictionary.companies.columns.details}
          className={activeMobileTab !== "details" ? "hidden md:flex" : undefined}
        >
          {renderDetailsContent()}
        </ColumnPanel>
      </div>
    </div>
  )
}
