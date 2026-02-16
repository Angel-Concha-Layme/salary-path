"use client"

import Link from "next/link"
import { useState } from "react"
import { UserCircle2Icon } from "lucide-react"

import { useProfileOverviewQuery } from "@/app/hooks/profile/use-profile-overview"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { ApiClientError } from "@/app/types/api"
import { CareerEventsTable } from "@/components/profile/career-events-table"
import { ProfileWorkSettingsEditor } from "@/components/profile/profile-work-settings-editor"
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
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-sm">
      <header className="border-b border-border/70 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary/80">
          {title}
        </h2>
      </header>
      <div className="p-4">{children}</div>
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
    <div className="rounded-lg border border-border/80 bg-background px-3 py-2 shadow-xs">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary/75">{label}</p>
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

export function ProfilePanel() {
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
    return <StateCard title={dictionary.profile.title} message={dictionary.common.loading} />
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
    { key: "workSettings", label: dictionary.profile.sections.workSettings },
    { key: "currentSalary", label: dictionary.profile.sections.currentSalary },
    { key: "careerEvents", label: dictionary.profile.sections.careerEvents },
    { key: "usefulInformation", label: dictionary.profile.sections.usefulInformation },
  ]

  const isSectionVisible = (section: ProfileSectionKey) =>
    layoutMode === "vertical" || activeSection === section

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

  return (
    <div className="space-y-5">
      <header className="space-y-1 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">{dictionary.profile.title}</h1>
        <p className="text-sm text-muted-foreground">{dictionary.profile.subtitle}</p>
        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary/70">
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
      </header>

      {layoutMode === "tabs" ? (
        <nav
          className="rounded-xl border border-border/80 bg-card p-2 shadow-sm"
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
                      "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-semibold",
                      selected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary"
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

      {isSectionVisible("userInformation") ? (
        <ProfileSection title={dictionary.profile.sections.userInformation}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[352px_minmax(0,1fr)_minmax(0,1fr)] xl:grid-rows-3">
            <div className="overflow-hidden rounded-lg border border-primary/20 bg-primary/5 md:col-span-2 xl:col-span-1 xl:row-span-3">
              {profile.user.image ? (
                <img
                  src={profile.user.image}
                  alt={profile.user.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full min-h-[352px] items-center justify-center">
                  <UserCircle2Icon className="size-20 text-muted-foreground" />
                </div>
              )}
            </div>
            <FieldCard label={dictionary.auth.name} value={profile.user.name} />
            <FieldCard label={dictionary.auth.email} value={profile.user.email} />
            <FieldCard
              label={dictionary.permissions.accessLabel}
              value={
                <Badge variant="outline" className="border-primary/35 bg-primary/10 text-primary">
                  {profile.user.role}
                </Badge>
              }
            />
            <FieldCard
              label={dictionary.profile.user.authSource}
              value={
                <Badge variant="outline" className="border-primary/35 bg-primary/10 text-primary">
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
      ) : null}

      {isSectionVisible("workSettings") ? (
        <ProfileSection title={dictionary.profile.sections.workSettings}>
          <ProfileWorkSettingsEditor
            currency={profile.financeSettings?.currency ?? profile.usefulInfo.preferredCurrency}
            locale={profile.financeSettings?.locale ?? profile.usefulInfo.preferredLocale}
            monthlyWorkHours={profile.usefulInfo.monthlyWorkHours}
            workDaysPerYear={profile.usefulInfo.workDaysPerYear}
          />
        </ProfileSection>
      ) : null}

      {isSectionVisible("currentSalary") ? (
        <ProfileSection title={dictionary.profile.sections.currentSalary}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FieldCard
              label={dictionary.profile.salary.annualAverage}
              value={
                profile.salary.annualAverage !== null
                  ? formatAmount(locale, profile.salary.baseCurrency, profile.salary.annualAverage, 0)
                  : dictionary.profile.notAvailable
              }
              muted={profile.salary.annualAverage === null}
            />
            <FieldCard
              label={dictionary.profile.salary.baseCurrency}
              value={profile.salary.baseCurrency}
            />
            <FieldCard
              label={dictionary.profile.salary.includedInAverage}
              value={formatNumber(locale, profile.salary.annualAverageCompanyCount, 0)}
            />
            <FieldCard
              label={dictionary.profile.salary.excludedFromAverage}
              value={formatNumber(locale, profile.salary.excludedFromAverageCount, 0)}
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            {profile.salary.byCompany.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed border-primary/35 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">{dictionary.profile.empty.salaries}</p>
                <Button asChild size="sm">
                  <Link href="/companies">{dictionary.personalPath.empty.cta}</Link>
                </Button>
              </div>
            ) : (
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-primary/8 text-xs uppercase tracking-[0.08em] text-primary/85">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      {dictionary.personalPath.table.columns.displayName}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      {dictionary.personalPath.table.columns.roleDisplayName}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      {dictionary.personalPath.table.columns.compensationType}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      {dictionary.profile.salary.monthlyEquivalent}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      {dictionary.profile.salary.annualizedSalary}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      {dictionary.personalPath.table.columns.eventCount}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profile.salary.byCompany.map((companySalary) => (
                    <tr
                      key={companySalary.pathCompanyId}
                      className="border-t border-border/70 align-top text-foreground transition-colors hover:bg-primary/5"
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full border border-border/80"
                            style={{ backgroundColor: companySalary.color }}
                          />
                          {companySalary.displayName}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {companySalary.roleDisplayName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {companySalary.compensationType === "hourly"
                          ? dictionary.companies.options.compensationHourly
                          : dictionary.companies.options.compensationMonthly}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {companySalary.monthlyEquivalent !== null
                          ? formatAmount(locale, companySalary.currency, companySalary.monthlyEquivalent, 2)
                          : dictionary.profile.notAvailable}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {companySalary.annualizedSalary !== null
                          ? formatAmount(locale, companySalary.currency, companySalary.annualizedSalary, 0)
                          : dictionary.profile.notAvailable}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {formatNumber(locale, companySalary.eventCount, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ProfileSection>
      ) : null}

      {isSectionVisible("careerEvents") ? (
        <ProfileSection title={dictionary.profile.sections.careerEvents}>
          {profile.careerEventsByCompany.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed border-primary/35 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">{dictionary.profile.empty.events}</p>
              <Button asChild size="sm">
                <Link href="/companies">{dictionary.personalPath.empty.cta}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.careerEventsByCompany.map((companyGroup) => (
                <div
                  key={companyGroup.pathCompanyId}
                  className="overflow-hidden rounded-lg border border-border/80"
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-primary/6 px-3 py-2">
                    <span
                      className="size-2.5 rounded-full border border-border/80"
                      style={{ backgroundColor: companyGroup.color }}
                    />
                    <p className="text-sm font-medium">{companyGroup.displayName}</p>
                    <span className="text-xs text-muted-foreground">· {companyGroup.roleDisplayName}</span>
                    <Badge variant="outline" className="ml-auto border-primary/35 bg-primary/10 text-primary">
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
          )}
        </ProfileSection>
      ) : null}

      {isSectionVisible("usefulInformation") ? (
        <ProfileSection title={dictionary.profile.sections.usefulInformation}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
      ) : null}
    </div>
  )
}
