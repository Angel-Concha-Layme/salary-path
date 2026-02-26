"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronDownIcon, UserCircle2Icon } from "lucide-react"

import { PersonalPathCompaniesTableMobileLayout } from "@/app/(protected-app)/career-path/salary-tracking/_components/personal-path-companies-table-layouts"
import { useBreakpointData } from "@/app/hooks/use-breakpoint-data"
import { useProfileOverviewQuery } from "@/app/hooks/profile/use-profile-overview"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import type { PersonalPathCompanyTableRow } from "@/app/lib/models/personal-path/personal-path-chart.model"
import { ApiClientError } from "@/app/types/api"
import { RouteScreen } from "@/components/layout/route-screen"
import { ProfileWorkSettingsEditor } from "@/app/(protected-app)/profile/_components/profile-work-settings-editor"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

function StateCard({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function formatAmount(
  locale: string,
  currency: string,
  amount: number,
  maximumFractionDigits = 2
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits,
    }).format(amount)
  } catch {
    return `${amount.toFixed(maximumFractionDigits)} ${currency}`
  }
}

function formatDateValue(value: string | null, locale: string): string {
  if (!value) {
    return "—"
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed)
}

function formatNumber(locale: string, value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value)
}

function ProfileSection({
  title,
  children,
  mobileCollapsible = false,
  defaultMobileOpen = true,
}: {
  title: string
  children: React.ReactNode
  mobileCollapsible?: boolean
  defaultMobileOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultMobileOpen)

  return (
    <section className="rounded-2xl bg-card/35 text-card-foreground backdrop-blur-[1px]">
      {mobileCollapsible ? (
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-1 pb-2 pt-1 text-left md:px-4 md:py-3"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-label={title}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:text-sm md:text-foreground">
            {title}
          </h2>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform md:text-foreground",
              isOpen && "rotate-180"
            )}
          />
        </button>
      ) : (
        <header className="px-1 pb-2 pt-1 md:px-4 md:py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:text-sm md:text-foreground">
            {title}
          </h2>
        </header>
      )}
      <div className={cn("p-2 md:p-4", mobileCollapsible && !isOpen && "hidden")}>
        {children}
      </div>
    </section>
  )
}

function FieldCard({
  label,
  value,
  muted,
  mono,
}: {
  label: string
  value: React.ReactNode
  muted?: boolean
  mono?: boolean
}) {
  return (
    <div className="rounded-xl bg-background/80 px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground/80">{label}</p>
      <div className={cn("mt-1 text-sm", muted && "text-muted-foreground", mono && "font-mono text-xs")}>
        {value}
      </div>
    </div>
  )
}

function ProfileInfoList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-xl bg-background/75 px-3 py-1.5", className)}>
      {children}
    </div>
  )
}

function ProfileInfoRow({
  label,
  value,
  muted,
  mono,
}: {
  label: string
  value: React.ReactNode
  muted?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <p className="min-w-0 text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "max-w-[58%] text-right text-sm font-semibold text-foreground break-words",
          muted && "text-muted-foreground",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </p>
    </div>
  )
}

function SectionSummary({
  text,
}: {
  text: string
}) {
  return <p className="mb-3 text-sm text-muted-foreground">{text}</p>
}

export function ProfileScreen() {
  const { dictionary, locale } = useDictionary()
  const breakpoint = useBreakpointData()
  const profileQuery = useProfileOverviewQuery()
  const profile = profileQuery.data
  const eventTypeLabels = dictionary.companies.eventTypes

  if (profileQuery.isLoading) {
    return (
      <RouteScreen
        title={dictionary.profile.title}
        subtitle={dictionary.profile.subtitle}
        isLoading
      >
        {null}
      </RouteScreen>
    )
  }

  if (profileQuery.isError) {
    const errorMessage =
      profileQuery.error instanceof ApiClientError
        ? profileQuery.error.message
        : dictionary.common.unknownError

    return <StateCard title={dictionary.errors.pageTitle} message={errorMessage} />
  }

  if (!profile?.user?.id) {
    return <StateCard title={dictionary.profile.title} message={dictionary.errors.notFoundBody} />
  }

  const userAvatarContent = profile.user.image ? (
    <img
      src={profile.user.image}
      alt={profile.user.name}
      className="h-full w-full object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  ) : (
    <UserCircle2Icon className="size-14 text-muted-foreground md:size-20" />
  )
  const summaryCompanies = profile.salary.byCompany
  const summaryEventsByCompanyId = new Map<string, PathCompanyEventsEntity[]>(
    profile.careerEventsByCompany.map((companyGroup) => [
      companyGroup.pathCompanyId,
      companyGroup.events.map((event) => ({
        id: event.id,
        pathCompanyId: companyGroup.pathCompanyId,
        eventType: event.eventType,
        effectiveDate: event.effectiveDate,
        amount: event.amount,
        notes: event.notes,
        createdAt: event.effectiveDate,
        updatedAt: event.effectiveDate,
        deletedAt: null,
      })),
    ])
  )
  const summaryRows: PersonalPathCompanyTableRow[] = summaryCompanies
    .map((company) => {
      const companyEvents = summaryEventsByCompanyId.get(company.pathCompanyId) ?? []
      const sortedByDateDesc = [...companyEvents].sort(
        (left, right) => new Date(right.effectiveDate).getTime() - new Date(left.effectiveDate).getTime()
      )
      const latestEvent = sortedByDateDesc[0] ?? null
      const oldestEvent = sortedByDateDesc[sortedByDateDesc.length - 1] ?? null
      const endOfEmploymentEvent =
        sortedByDateDesc.find((event) => event.eventType === "end_of_employment") ?? null

      return {
        id: company.pathCompanyId,
        displayName: company.displayName,
        roleDisplayName: company.roleDisplayName,
        startDate: oldestEvent?.effectiveDate ?? company.currentRateDate ?? dictionary.profile.notAvailable,
        endDate: endOfEmploymentEvent?.effectiveDate ?? null,
        monthlyAverageSalary: company.monthlyEquivalent,
        annualSalary: company.annualizedSalary,
        compensationType: company.compensationType,
        currency: company.currency,
        score: 0,
        review: "",
        color: company.color,
        companyCatalogId: null,
        roleCatalogId: null,
        createdAt: latestEvent?.effectiveDate ?? company.currentRateDate ?? "",
        updatedAt: latestEvent?.effectiveDate ?? company.currentRateDate ?? "",
        eventCount: company.eventCount,
        latestEventType: latestEvent?.eventType ?? null,
        latestEventDate: latestEvent?.effectiveDate ?? null,
        latestEventAmount: latestEvent?.amount ?? null,
      }
    })
    .sort((left, right) => {
      const leftTimestamp = left.latestEventDate
        ? new Date(left.latestEventDate).getTime()
        : left.createdAt
          ? new Date(left.createdAt).getTime()
          : 0
      const rightTimestamp = right.latestEventDate
        ? new Date(right.latestEventDate).getTime()
        : right.createdAt
          ? new Date(right.createdAt).getTime()
          : 0

      return rightTimestamp - leftTimestamp
    })

  const userInformationSection = (
    <ProfileSection
      title={dictionary.profile.sections.userInformation}
      mobileCollapsible
      defaultMobileOpen
    >
      <SectionSummary text={dictionary.profile.sectionSummaries.userInformation} />
      <div className="flex flex-col items-center px-2 py-3 text-center">
        <div
          className={cn(
            "flex size-24 items-center justify-center overflow-hidden rounded-full",
            !profile.user.image && "bg-accent/15"
          )}
        >
          {userAvatarContent}
        </div>
        <p className="mt-3 text-xl font-semibold leading-tight text-foreground">
          {profile.user.name}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.user.email}
        </p>
      </div>
    </ProfileSection>
  )

  const currentSummarySection = (
    <ProfileSection
      title={dictionary.profile.sections.currentSummary}
      mobileCollapsible
    >
      <SectionSummary text={dictionary.profile.sectionSummaries.currentSummary} />
      <ProfileInfoList>
        <ProfileInfoRow
          label={dictionary.profile.salary.annualAverage}
          value={
            profile.salary.annualAverage !== null
              ? formatAmount(locale, profile.salary.baseCurrency, profile.salary.annualAverage, 0)
              : dictionary.profile.notAvailable
          }
          muted={profile.salary.annualAverage === null}
        />
        <ProfileInfoRow
          label={dictionary.profile.salary.monthlyEquivalent}
          value={
            profile.salary.annualAverage !== null
              ? formatAmount(locale, profile.salary.baseCurrency, profile.salary.annualAverage / 12, 2)
              : dictionary.profile.notAvailable
          }
          muted={profile.salary.annualAverage === null}
        />
      </ProfileInfoList>

      {summaryCompanies.length === 0 ? (
        <div className="mt-4 space-y-3 rounded-lg border border-dashed border-border/70 bg-background p-4">
          <p className="text-sm text-muted-foreground">{dictionary.profile.empty.salaries}</p>
          <Button asChild size="sm">
            <Link href="/career-path/companies">{dictionary.personalPath.empty.cta}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <PersonalPathCompaniesTableMobileLayout
            rows={summaryRows}
            locale={locale}
            labels={{
              displayName: dictionary.personalPath.table.columns.displayName,
              roleDisplayName: dictionary.personalPath.table.columns.roleDisplayName,
              startDate: dictionary.personalPath.table.columns.startDate,
              endDate: dictionary.personalPath.table.columns.endDate,
              monthlyAverageSalary: dictionary.personalPath.table.columns.monthlyAverageSalary,
              annualSalary: dictionary.profile.salary.annualizedSalary,
            }}
            notAvailableLabel={dictionary.profile.notAvailable}
            eventsByCompanyId={summaryEventsByCompanyId}
            eventTypeLabels={eventTypeLabels}
            detailsTitle={dictionary.personalPath.drawer.detailsTitle}
            eventsTitle={dictionary.profile.currentSummary.eventsTitle}
            noEventsLabel={dictionary.profile.empty.events}
            defaultExpanded={false}
          />
        </div>
      )}
    </ProfileSection>
  )

  const workSettingsSection = (
    <ProfileSection
      title={dictionary.profile.sections.workSettings}
      mobileCollapsible
    >
      <SectionSummary text={dictionary.profile.sectionSummaries.workSettings} />
      <ProfileWorkSettingsEditor
        currency={profile.financeSettings?.currency ?? profile.usefulInfo.preferredCurrency}
        locale={profile.financeSettings?.locale ?? profile.usefulInfo.preferredLocale}
        monthlyWorkHours={profile.usefulInfo.monthlyWorkHours}
        workDaysPerYear={profile.usefulInfo.workDaysPerYear}
        hasHourlyCompany={profile.salary.byCompany.some((companySalary) => companySalary.compensationType === "hourly")}
        showDescription={false}
      />
    </ProfileSection>
  )

  const usefulInformationSection = (
    <ProfileSection
      title={dictionary.profile.sections.usefulInformation}
      mobileCollapsible
    >
      <SectionSummary text={dictionary.profile.sectionSummaries.usefulInformation} />
      <ProfileInfoList className="md:hidden">
        <ProfileInfoRow
          label={dictionary.profile.useful.totalCompanies}
          value={formatNumber(locale, profile.usefulInfo.totalCompanies, 0)}
        />
        <ProfileInfoRow
          label={dictionary.profile.useful.activeCompanies}
          value={formatNumber(locale, profile.usefulInfo.activeCompanies, 0)}
        />
        <ProfileInfoRow
          label={dictionary.profile.useful.totalCareerEvents}
          value={formatNumber(locale, profile.usefulInfo.totalCareerEvents, 0)}
        />
        <ProfileInfoRow
          label={dictionary.profile.useful.averageCompanyScore}
          value={
            profile.usefulInfo.averageCompanyScore !== null
              ? formatNumber(locale, profile.usefulInfo.averageCompanyScore, 1)
              : dictionary.profile.notAvailable
          }
          muted={profile.usefulInfo.averageCompanyScore === null}
        />
        <ProfileInfoRow
          label={dictionary.profile.useful.firstCompanyStartDate}
          value={formatDateValue(profile.usefulInfo.firstCompanyStartDate, locale)}
          muted={!profile.usefulInfo.firstCompanyStartDate}
        />
        <ProfileInfoRow
          label={dictionary.profile.useful.latestCareerEventDate}
          value={formatDateValue(profile.usefulInfo.latestCareerEventDate, locale)}
          muted={!profile.usefulInfo.latestCareerEventDate}
        />
        <ProfileInfoRow
          label={dictionary.profile.useful.yearsTracked}
          value={
            profile.usefulInfo.yearsTracked !== null
              ? formatNumber(locale, profile.usefulInfo.yearsTracked, 2)
              : dictionary.profile.notAvailable
          }
          muted={profile.usefulInfo.yearsTracked === null}
        />
        <ProfileInfoRow
          label={dictionary.profile.useful.monthlyWorkHours}
          value={formatNumber(locale, profile.usefulInfo.monthlyWorkHours, 0)}
        />
        <ProfileInfoRow
          label={dictionary.profile.useful.workDaysPerYear}
          value={formatNumber(locale, profile.usefulInfo.workDaysPerYear, 0)}
        />
        <ProfileInfoRow
          label={dictionary.profile.useful.preferredCurrency}
          value={profile.usefulInfo.preferredCurrency}
        />
        <ProfileInfoRow
          label={dictionary.profile.useful.preferredLocale}
          value={profile.usefulInfo.preferredLocale}
        />
      </ProfileInfoList>

      <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
        <FieldCard
          label={dictionary.profile.useful.totalCompanies}
          value={formatNumber(locale, profile.usefulInfo.totalCompanies, 0)}
        />
        <FieldCard
          label={dictionary.profile.useful.activeCompanies}
          value={formatNumber(locale, profile.usefulInfo.activeCompanies, 0)}
        />
        <FieldCard
          label={dictionary.profile.useful.totalCareerEvents}
          value={formatNumber(locale, profile.usefulInfo.totalCareerEvents, 0)}
        />
        <FieldCard
          label={dictionary.profile.useful.averageCompanyScore}
          value={
            profile.usefulInfo.averageCompanyScore !== null
              ? formatNumber(locale, profile.usefulInfo.averageCompanyScore, 1)
              : dictionary.profile.notAvailable
          }
          muted={profile.usefulInfo.averageCompanyScore === null}
        />
        <FieldCard
          label={dictionary.profile.useful.firstCompanyStartDate}
          value={formatDateValue(profile.usefulInfo.firstCompanyStartDate, locale)}
          muted={!profile.usefulInfo.firstCompanyStartDate}
        />
        <FieldCard
          label={dictionary.profile.useful.latestCareerEventDate}
          value={formatDateValue(profile.usefulInfo.latestCareerEventDate, locale)}
          muted={!profile.usefulInfo.latestCareerEventDate}
        />
        <FieldCard
          label={dictionary.profile.useful.yearsTracked}
          value={
            profile.usefulInfo.yearsTracked !== null
              ? formatNumber(locale, profile.usefulInfo.yearsTracked, 2)
              : dictionary.profile.notAvailable
          }
          muted={profile.usefulInfo.yearsTracked === null}
        />
        <FieldCard
          label={dictionary.profile.useful.monthlyWorkHours}
          value={formatNumber(locale, profile.usefulInfo.monthlyWorkHours, 0)}
        />
        <FieldCard
          label={dictionary.profile.useful.workDaysPerYear}
          value={formatNumber(locale, profile.usefulInfo.workDaysPerYear, 0)}
        />
        <FieldCard
          label={dictionary.profile.useful.preferredCurrency}
          value={profile.usefulInfo.preferredCurrency}
        />
        <FieldCard
          label={dictionary.profile.useful.preferredLocale}
          value={profile.usefulInfo.preferredLocale}
        />
      </div>
    </ProfileSection>
  )

  const accountDetailsSection = (
    <ProfileSection
      title={dictionary.profile.sections.accountDetails}
      mobileCollapsible
    >
      <SectionSummary text={dictionary.profile.sectionSummaries.accountDetails} />
      <ProfileInfoList>
        <ProfileInfoRow
          label={dictionary.permissions.accessLabel}
          value={profile.user.role}
        />
        <ProfileInfoRow
          label={dictionary.profile.user.authSource}
          value={profile.source}
        />
        <ProfileInfoRow
          label={dictionary.profile.user.accountCreatedAt}
          value={formatDateValue(profile.user.createdAt, locale)}
        />
        <ProfileInfoRow
          label={dictionary.profile.user.accountUpdatedAt}
          value={formatDateValue(profile.user.updatedAt, locale)}
        />
      </ProfileInfoList>
    </ProfileSection>
  )

  return (
    <RouteScreen title={dictionary.profile.title} subtitle={dictionary.profile.subtitle}>
      {breakpoint.isDesktop ? (
        <div className="grid grid-cols-2 items-start gap-4">
          <div className="space-y-4">
            {currentSummarySection}
            {usefulInformationSection}
          </div>
          <div className="space-y-4">
            {workSettingsSection}
            {accountDetailsSection}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {userInformationSection}
          {currentSummarySection}
          {workSettingsSection}
          {usefulInformationSection}
          {accountDetailsSection}
        </div>
      )}
    </RouteScreen>
  )
}
