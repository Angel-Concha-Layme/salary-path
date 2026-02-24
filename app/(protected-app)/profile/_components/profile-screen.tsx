"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronDownIcon, UserCircle2Icon } from "lucide-react"

import { useProfileOverviewQuery } from "@/app/hooks/profile/use-profile-overview"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { ApiClientError } from "@/app/types/api"
import { RouteScreen } from "@/components/layout/route-screen"
import { CareerEventsTable } from "@/app/(protected-app)/profile/_components/career-events-table"
import { ProfileSalaryByCompanyTable } from "@/app/(protected-app)/profile/_components/profile-salary-by-company-table"
import { ProfileWorkSettingsEditor } from "@/app/(protected-app)/profile/_components/profile-work-settings-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const [isMobileOpen, setIsMobileOpen] = useState(defaultMobileOpen)

  return (
    <section className="rounded-xl bg-background text-card-foreground md:border md:border-border/80">
      {mobileCollapsible ? (
        <>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-1 pb-2 pt-1 text-left md:hidden"
            onClick={() => setIsMobileOpen((current) => !current)}
            aria-expanded={isMobileOpen}
            aria-label={title}
          >
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {title}
            </h2>
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                isMobileOpen && "rotate-180"
              )}
            />
          </button>
          <header className="hidden md:block md:border-b md:border-border/70 md:px-4 md:py-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
              {title}
            </h2>
          </header>
        </>
      ) : (
        <header className="px-1 pb-2 pt-1 md:border-b md:border-border/70 md:px-4 md:py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:text-sm md:text-foreground">
            {title}
          </h2>
        </header>
      )}
      <div className={cn("p-1 md:p-4", mobileCollapsible && !isMobileOpen && "hidden md:block")}>
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
    <div className="rounded-lg bg-background px-2 py-1.5 md:border md:border-border/80 md:px-3 md:py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground/80">{label}</p>
      <div className={cn("mt-1 text-sm", muted && "text-muted-foreground", mono && "font-mono text-xs")}>
        {value}
      </div>
    </div>
  )
}

type ProfileSectionKey =
  | "userInformation"
  | "workSettings"
  | "currentSalary"
  | "careerEvents"
  | "usefulInformation"
type ProfileLayoutMode = "tabs" | "vertical"

const PROFILE_LAYOUT_STORAGE_KEY = "salary-path:profile-layout"

function normalizeProfileLayoutMode(value: string | null): ProfileLayoutMode {
  return value === "vertical" ? "vertical" : "tabs"
}

export function ProfileScreen() {
  const { dictionary, locale } = useDictionary()
  const profileQuery = useProfileOverviewQuery()
  const profile = profileQuery.data
  const eventTypeLabels = dictionary.companies.eventTypes
  const [layoutMode, setLayoutMode] = useState<ProfileLayoutMode>(() => {
    if (typeof window === "undefined") {
      return "tabs"
    }

    try {
      return normalizeProfileLayoutMode(window.localStorage.getItem(PROFILE_LAYOUT_STORAGE_KEY))
    } catch {
      return "tabs"
    }
  })
  const [activeSection, setActiveSection] = useState<ProfileSectionKey>("userInformation")

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

  const sectionPages: Array<{ key: ProfileSectionKey; label: string }> = [
    { key: "userInformation", label: dictionary.profile.sections.userInformation },
    { key: "currentSalary", label: dictionary.profile.sections.currentSalary },
    { key: "workSettings", label: dictionary.profile.sections.workSettings },
    { key: "careerEvents", label: dictionary.profile.sections.careerEvents },
    { key: "usefulInformation", label: dictionary.profile.sections.usefulInformation },
  ]

  const hiddenOnDesktopClass = (section: ProfileSectionKey) =>
    layoutMode === "tabs" && activeSection !== section ? "md:hidden" : ""

  const handleLayoutModeChange = (value: string) => {
    const nextMode = normalizeProfileLayoutMode(value)
    setLayoutMode(nextMode)

    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(PROFILE_LAYOUT_STORAGE_KEY, nextMode)
    } catch {
      // Ignore storage write errors (private mode, blocked storage, etc.).
    }
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

  return (
    <RouteScreen
      title={dictionary.profile.title}
      subtitle={dictionary.profile.subtitle}
      headerActions={(
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {dictionary.profile.layout.label}
          </p>
          <Select value={layoutMode} onValueChange={handleLayoutModeChange}>
            <SelectTrigger size="sm" className="mt-1 w-[180px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="tabs">{dictionary.profile.layout.tabs}</SelectItem>
              <SelectItem value="vertical">{dictionary.profile.layout.vertical}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    >
      {layoutMode === "tabs" ? (
        <nav
          className="hidden rounded-xl bg-background p-2 md:block md:border md:border-border/80"
          aria-label={dictionary.profile.title}
        >
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {sectionPages.map((section, index) => {
              const selected = section.key === activeSection

              return (
                <Button
                  key={section.key}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  className={cn(
                    "h-auto justify-start gap-2 px-3 py-2 text-left",
                    selected && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => setActiveSection(section.key)}
                  aria-current={selected ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-semibold border border-border/70",
                      selected
                        ? "border-primary-foreground/35 bg-primary-foreground/20 text-primary-foreground"
                        : "bg-background text-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate">{section.label}</span>
                </Button>
              )
            })}
          </div>
        </nav>
      ) : null}

      <div className={hiddenOnDesktopClass("userInformation")}>
        <ProfileSection
          title={dictionary.profile.sections.userInformation}
          mobileCollapsible
          defaultMobileOpen
        >
          <div className="flex flex-col items-center px-2 py-3 text-center md:hidden">
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

          <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-[352px_minmax(0,1fr)_minmax(0,1fr)] xl:grid-rows-3">
            <div className="overflow-hidden rounded-lg bg-background md:col-span-2 md:border md:border-border/80 xl:col-span-1 xl:row-span-3">
              {profile.user.image ? (
                userAvatarContent
              ) : (
                <div className="flex h-full min-h-[352px] items-center justify-center">
                  {userAvatarContent}
                </div>
              )}
            </div>
            <FieldCard label={dictionary.auth.name} value={profile.user.name} />
            <FieldCard label={dictionary.auth.email} value={profile.user.email} />
            <FieldCard
              label={dictionary.permissions.accessLabel}
              value={
                <Badge variant="outline" className="border-border/70 bg-background text-foreground">
                  {profile.user.role}
                </Badge>
              }
            />
            <FieldCard
              label={dictionary.profile.user.authSource}
              value={
                <Badge variant="outline" className="border-border/70 bg-background text-foreground">
                  {profile.source}
                </Badge>
              }
            />
            <FieldCard
              label={dictionary.profile.user.accountCreatedAt}
              value={formatDateValue(profile.user.createdAt, locale)}
            />
            <FieldCard
              label={dictionary.profile.user.accountUpdatedAt}
              value={formatDateValue(profile.user.updatedAt, locale)}
            />
          </div>

        </ProfileSection>
      </div>

      <div className={hiddenOnDesktopClass("currentSalary")}>
        <ProfileSection
          title={dictionary.profile.sections.currentSalary}
          mobileCollapsible
          defaultMobileOpen={false}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.salary.annualAverage}</p>
              <p className={cn("text-sm font-semibold tabular-nums text-foreground", profile.salary.annualAverage === null && "text-muted-foreground")}>
                {profile.salary.annualAverage !== null
                  ? formatAmount(locale, profile.salary.baseCurrency, profile.salary.annualAverage, 0)
                  : dictionary.profile.notAvailable}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.salary.monthlyEquivalent}</p>
              <p className={cn("text-sm font-semibold tabular-nums text-foreground", profile.salary.annualAverage === null && "text-muted-foreground")}>
                {profile.salary.annualAverage !== null
                  ? formatAmount(locale, profile.salary.baseCurrency, profile.salary.annualAverage / 12, 2)
                  : dictionary.profile.notAvailable}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {profile.salary.byCompany.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-background p-4">
                <p className="text-sm text-muted-foreground">{dictionary.profile.empty.salaries}</p>
                <Button asChild size="sm">
                  <Link href="/career-path/companies">{dictionary.personalPath.empty.cta}</Link>
                </Button>
              </div>
            ) : (
              <ProfileSalaryByCompanyTable
                companies={profile.salary.byCompany}
                locale={locale}
                notAvailableLabel={dictionary.profile.notAvailable}
                compensationLabels={{
                  hourly: dictionary.companies.options.compensationHourly,
                  monthly: dictionary.companies.options.compensationMonthly,
                }}
                labels={{
                  displayName: dictionary.personalPath.table.columns.displayName,
                  roleDisplayName: dictionary.personalPath.table.columns.roleDisplayName,
                  compensationType: dictionary.personalPath.table.columns.compensationType,
                  monthlyEquivalent: dictionary.profile.salary.monthlyEquivalent,
                  annualizedSalary: dictionary.profile.salary.annualizedSalary,
                  eventCount: dictionary.personalPath.table.columns.eventCount,
                }}
              />
            )}
          </div>
        </ProfileSection>
      </div>

      <div className={hiddenOnDesktopClass("workSettings")}>
        <ProfileSection
          title={dictionary.profile.sections.workSettings}
          mobileCollapsible
          defaultMobileOpen={false}
        >
          <ProfileWorkSettingsEditor
            currency={profile.financeSettings?.currency ?? profile.usefulInfo.preferredCurrency}
            locale={profile.financeSettings?.locale ?? profile.usefulInfo.preferredLocale}
            monthlyWorkHours={profile.usefulInfo.monthlyWorkHours}
            workDaysPerYear={profile.usefulInfo.workDaysPerYear}
          />
        </ProfileSection>
      </div>

      <div className={hiddenOnDesktopClass("careerEvents")}>
        <ProfileSection
          title={dictionary.profile.sections.careerEvents}
          mobileCollapsible
          defaultMobileOpen={false}
        >
          {profile.careerEventsByCompany.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-background p-4">
              <p className="text-sm text-muted-foreground">{dictionary.profile.empty.events}</p>
              <Button asChild size="sm">
                <Link href="/career-path/companies">{dictionary.personalPath.empty.cta}</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1 md:hidden">
                {profile.careerEventsByCompany.map((companyGroup) => (
                  <details
                    key={companyGroup.pathCompanyId}
                    className="group overflow-hidden rounded-lg bg-accent/10"
                  >
                    <summary className="flex list-none cursor-pointer items-center gap-2 px-2.5 py-2 [&::-webkit-details-marker]:hidden">
                      <span
                        className="size-2.5 rounded-full border border-border/80"
                        style={{ backgroundColor: companyGroup.color }}
                      />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {companyGroup.displayName}
                      </p>
                      <Badge variant="outline" className="shrink-0 border-border/70 bg-background text-foreground">
                        {formatNumber(locale, companyGroup.events.length, 0)} {dictionary.profile.events.countLabel}
                      </Badge>
                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>

                    <div className="pb-1">
                      <p className="px-2.5 pb-1 text-xs text-muted-foreground">
                        {companyGroup.roleDisplayName}
                      </p>
                      <CareerEventsTable
                        events={companyGroup.events}
                        currency={companyGroup.currency}
                        compensationType={companyGroup.compensationType}
                        monthlyWorkHours={profile.usefulInfo.monthlyWorkHours}
                        workDaysPerYear={profile.usefulInfo.workDaysPerYear}
                        locale={locale}
                        eventTypeLabels={eventTypeLabels}
                        notAvailableLabel={dictionary.profile.notAvailable}
                        emptyMessage={dictionary.companies.empty.events}
                        labels={{
                          effectiveDate: dictionary.companies.labels.effectiveDate,
                          eventType: dictionary.companies.labels.eventType,
                          hourlyRate: dictionary.profile.events.hourlyRate,
                          monthlyAverage: dictionary.profile.events.monthlyAverage,
                          annualSalary: dictionary.profile.events.annualSalary,
                        }}
                      />
                    </div>
                  </details>
                ))}
              </div>

              <div className="hidden space-y-3 md:block">
                {profile.careerEventsByCompany.map((companyGroup) => (
                  <div
                    key={companyGroup.pathCompanyId}
                    className="overflow-hidden rounded-lg bg-background md:border md:border-border/80"
                  >
                    <div className="flex flex-wrap items-center gap-2 bg-background px-2 py-2 md:border-b md:border-border/70 md:px-3">
                      <span
                        className="size-2.5 rounded-full border border-border/80"
                        style={{ backgroundColor: companyGroup.color }}
                      />
                      <p className="text-sm font-medium">{companyGroup.displayName}</p>
                      <span className="text-xs text-muted-foreground">· {companyGroup.roleDisplayName}</span>
                      <Badge variant="outline" className="ml-auto border-border/70 bg-background text-foreground">
                        {formatNumber(locale, companyGroup.events.length, 0)} {dictionary.profile.events.countLabel}
                      </Badge>
                    </div>

                    <CareerEventsTable
                      events={companyGroup.events}
                      currency={companyGroup.currency}
                      compensationType={companyGroup.compensationType}
                      monthlyWorkHours={profile.usefulInfo.monthlyWorkHours}
                      workDaysPerYear={profile.usefulInfo.workDaysPerYear}
                      locale={locale}
                      eventTypeLabels={eventTypeLabels}
                      notAvailableLabel={dictionary.profile.notAvailable}
                      emptyMessage={dictionary.companies.empty.events}
                      labels={{
                        effectiveDate: dictionary.companies.labels.effectiveDate,
                        eventType: dictionary.companies.labels.eventType,
                        hourlyRate: dictionary.profile.events.hourlyRate,
                        monthlyAverage: dictionary.profile.events.monthlyAverage,
                        annualSalary: dictionary.profile.events.annualSalary,
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </ProfileSection>
      </div>

      <div className={hiddenOnDesktopClass("usefulInformation")}>
        <ProfileSection
          title={dictionary.profile.sections.usefulInformation}
          mobileCollapsible
          defaultMobileOpen={false}
        >
          <div className="space-y-1 md:hidden">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.totalCompanies}</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatNumber(locale, profile.usefulInfo.totalCompanies, 0)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.activeCompanies}</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatNumber(locale, profile.usefulInfo.activeCompanies, 0)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.totalCareerEvents}</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatNumber(locale, profile.usefulInfo.totalCareerEvents, 0)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.averageCompanyScore}</p>
              <p className={cn("text-sm font-semibold tabular-nums text-foreground", profile.usefulInfo.averageCompanyScore === null && "text-muted-foreground")}>
                {profile.usefulInfo.averageCompanyScore !== null
                  ? formatNumber(locale, profile.usefulInfo.averageCompanyScore, 1)
                  : dictionary.profile.notAvailable}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.firstCompanyStartDate}</p>
              <p className={cn("text-sm font-semibold text-foreground", !profile.usefulInfo.firstCompanyStartDate && "text-muted-foreground")}>
                {formatDateValue(profile.usefulInfo.firstCompanyStartDate, locale)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.latestCareerEventDate}</p>
              <p className={cn("text-sm font-semibold text-foreground", !profile.usefulInfo.latestCareerEventDate && "text-muted-foreground")}>
                {formatDateValue(profile.usefulInfo.latestCareerEventDate, locale)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.yearsTracked}</p>
              <p className={cn("text-sm font-semibold tabular-nums text-foreground", profile.usefulInfo.yearsTracked === null && "text-muted-foreground")}>
                {profile.usefulInfo.yearsTracked !== null
                  ? formatNumber(locale, profile.usefulInfo.yearsTracked, 2)
                  : dictionary.profile.notAvailable}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.monthlyWorkHours}</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatNumber(locale, profile.usefulInfo.monthlyWorkHours, 0)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.workDaysPerYear}</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatNumber(locale, profile.usefulInfo.workDaysPerYear, 0)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.preferredCurrency}</p>
              <p className="text-sm font-semibold text-foreground">
                {profile.usefulInfo.preferredCurrency}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.useful.preferredLocale}</p>
              <p className="text-sm font-semibold text-foreground">
                {profile.usefulInfo.preferredLocale}
              </p>
            </div>
          </div>

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
      </div>

      <div className="md:hidden">
        <ProfileSection
          title={dictionary.profile.sections.accountDetails}
          mobileCollapsible
          defaultMobileOpen={false}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.permissions.accessLabel}</p>
              <p className="text-sm font-semibold text-foreground">
                {profile.user.role}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.user.authSource}</p>
              <p className="text-sm font-semibold text-foreground">
                {profile.source}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.user.accountCreatedAt}</p>
              <p className="text-sm font-semibold text-foreground">
                {formatDateValue(profile.user.createdAt, locale)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-accent/15 px-2.5 py-2">
              <p className="text-xs text-muted-foreground">{dictionary.profile.user.accountUpdatedAt}</p>
              <p className="text-sm font-semibold text-foreground">
                {formatDateValue(profile.user.updatedAt, locale)}
              </p>
            </div>
          </div>
        </ProfileSection>
      </div>
    </RouteScreen>
  )
}
