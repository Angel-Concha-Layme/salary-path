"use client"

import { useMemo, useState } from "react"

import { useBreakpointData } from "@/app/hooks/use-breakpoint-data"
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
import { CompaniesColumnPanel } from "@/app/(protected-app)/career-path/companies/_components/companies-column-panel"
import { CompaniesDesktopLayout } from "@/app/(protected-app)/career-path/companies/_components/companies-desktop-layout"
import { CompaniesDetailsContent } from "@/app/(protected-app)/career-path/companies/_components/companies-details-content"
import {
  CompaniesMobileLayout,
  type CompaniesMobileTab,
} from "@/app/(protected-app)/career-path/companies/_components/companies-mobile-layout"
import { CompaniesListContent } from "@/app/(protected-app)/career-path/companies/_components/companies-list-content"
import { CreateCompanyDialog } from "@/app/(protected-app)/career-path/companies/_components/create-company-dialog"
import { CreateEventDialog } from "@/app/(protected-app)/career-path/companies/_components/create-event-dialog"
import { EventsListContent } from "@/app/(protected-app)/career-path/companies/_components/events-list-content"
import { RouteScreen } from "@/components/layout/route-screen"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type CompaniesSortOrder = "newest_first" | "oldest_first"

const COMPANIES_SORT_ORDER_STORAGE_KEY = "salary-path:companies-sort-order"

interface CreateCompanySubmission {
  company: PathCompaniesCreateInput
  initialRate: number
  finalRate: number | null
}

function normalizeCompaniesSortOrder(value: string | null): CompaniesSortOrder {
  return value === "oldest_first" ? "oldest_first" : "newest_first"
}

export function CompaniesScreen() {
  const { dictionary, locale } = useDictionary()
  const breakpoint = useBreakpointData()

  const [selectedCompanyIdState, setSelectedCompanyId] = useState<string | null>(null)
  const [selectedEventIdState, setSelectedEventId] = useState<string | null>(null)
  const [activeMobileTab, setActiveMobileTab] = useState<CompaniesMobileTab>("companies")
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
  const companyEventsQuery = usePathCompanyEventsByOwnerListQuery({ limit: 100 })

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

  const companiesPanel = (
    <CompaniesColumnPanel
      title={dictionary.companies.columns.companies}
      action={
        <CreateCompanyDialog
          onCreate={handleCreateCompany}
          isPending={createCompanyMutation.isLoading || createEventMutation.isLoading}
        />
      }
    >
      <CompaniesListContent
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        dateFormatter={dateFormatter}
        isLoading={companiesQuery.isLoading}
        error={companiesQuery.error}
        emptyMessage={dictionary.companies.empty.companies}
        unknownErrorMessage={dictionary.common.unknownError}
        onSelectCompany={(companyId) => {
          setSelectedCompanyId(companyId)
          setSelectedEventId(null)
          setActiveMobileTab("events")
        }}
      />
    </CompaniesColumnPanel>
  )

  const eventsPanel = (
    <CompaniesColumnPanel
      title={dictionary.companies.columns.events}
      action={
        <CreateEventDialog
          key={selectedCompanyId ?? "no-company"}
          canCreate={Boolean(selectedCompanyId)}
          compensationType={selectedCompany?.compensationType ?? "monthly"}
          currency={selectedCompany?.currency ?? "USD"}
          onCreate={handleCreateEvent}
          isPending={createEventMutation.isLoading}
        />
      }
    >
      <EventsListContent
        events={events}
        selectedEventId={selectedEventId}
        selectedCompanyId={selectedCompanyId}
        selectedCompanyCurrency={selectedCompany?.currency ?? "USD"}
        dateFormatter={dateFormatter}
        locale={locale}
        isLoading={companyEventsQuery.isLoading}
        error={companyEventsQuery.error}
        emptyNoCompanyMessage={dictionary.companies.empty.noCompanySelected}
        emptyEventsMessage={dictionary.companies.empty.events}
        unknownErrorMessage={dictionary.common.unknownError}
        getEventTypeLabel={(eventType) => dictionary.companies.eventTypes[eventType]}
        onSelectEvent={(eventId) => {
          setSelectedEventId(eventId)
          setActiveMobileTab("details")
        }}
      />
    </CompaniesColumnPanel>
  )

  const detailsPanel = (
    <CompaniesColumnPanel title={dictionary.companies.columns.details}>
      <CompaniesDetailsContent
        selectedCompany={selectedCompany}
        selectedEventId={selectedEventId}
        selectedEvent={selectedEvent}
        isEventsLoading={companyEventsQuery.isLoading}
        emptyMessage={dictionary.companies.empty.details}
        onUpdateCompany={handleUpdateCompany}
        onDeleteCompany={handleDeleteCompany}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        isCompanySaving={updateCompanyMutation.isLoading}
        isCompanyDeleting={deleteCompanyMutation.isLoading}
        isEventSaving={updateEventMutation.isLoading}
        isEventDeleting={deleteEventMutation.isLoading}
      />
    </CompaniesColumnPanel>
  )

  const isScreenLoading = companiesQuery.isLoading || companyEventsQuery.isLoading

  return (
    <RouteScreen
      title={dictionary.companies.title}
      subtitle={dictionary.companies.subtitle}
      isLoading={isScreenLoading}
      className={cn(breakpoint.isDesktop && "h-full min-h-0 flex flex-col")}
      bodyClassName={cn(
        breakpoint.isDesktop && "mt-0 flex min-h-0 flex-1 flex-col space-y-0 px-3 pb-3 pt-4"
      )}
      headerActions={(
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
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
      )}
    >
      {breakpoint.isDesktop ? (
        <CompaniesDesktopLayout
          breakpoint={breakpoint}
          state={{
            companiesPanel,
            eventsPanel,
            detailsPanel,
          }}
          actions={{}}
        />
      ) : (
        <CompaniesMobileLayout
          breakpoint={breakpoint}
          state={{
            activeTab: activeMobileTab,
            companiesPanel,
            eventsPanel,
            detailsPanel,
            tabLabels: {
              companies: dictionary.companies.tabs.companies,
              events: dictionary.companies.tabs.events,
              details: dictionary.companies.tabs.details,
            },
          }}
          actions={{
            onTabChange: setActiveMobileTab,
          }}
        />
      )}
    </RouteScreen>
  )
}
