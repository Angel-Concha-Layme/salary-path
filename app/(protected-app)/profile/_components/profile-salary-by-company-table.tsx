"use client"

import type { CSSProperties } from "react"

import type { ProfileSalaryByCompany } from "@/app/lib/models/profile/profile-overview.model"

interface ProfileSalaryByCompanyTableLabels {
  displayName: string
  roleDisplayName: string
  compensationType: string
  monthlyEquivalent: string
  annualizedSalary: string
  eventCount: string
}

interface ProfileSalaryByCompanyTableProps {
  companies: ProfileSalaryByCompany[]
  locale: string
  labels: ProfileSalaryByCompanyTableLabels
  compensationLabels: {
    hourly: string
    monthly: string
  }
  notAvailableLabel: string
}

function formatAmount(
  locale: string,
  currency: string,
  amount: number,
  maximumFractionDigits = 2
): string {
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

function formatNumber(locale: string, value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value)
}

function getCompensationTypeLabel(
  compensationType: ProfileSalaryByCompany["compensationType"],
  compensationLabels: ProfileSalaryByCompanyTableProps["compensationLabels"]
): string {
  return compensationType === "hourly" ? compensationLabels.hourly : compensationLabels.monthly
}

function getMonthlyEquivalentValue(
  company: ProfileSalaryByCompany,
  locale: string,
  notAvailableLabel: string
): string {
  if (company.monthlyEquivalent === null) {
    return notAvailableLabel
  }

  return formatAmount(locale, company.currency, company.monthlyEquivalent, 2)
}

function getAnnualizedSalaryValue(
  company: ProfileSalaryByCompany,
  locale: string,
  notAvailableLabel: string
): string {
  if (company.annualizedSalary === null) {
    return notAvailableLabel
  }

  return formatAmount(locale, company.currency, company.annualizedSalary, 0)
}

function hexToRgb(hexColor: string): { red: number; green: number; blue: number } | null {
  const normalized = hexColor.trim().replace("#", "")

  if (![3, 6].includes(normalized.length)) {
    return null
  }

  const expanded = normalized.length === 3
    ? normalized.split("").map((segment) => `${segment}${segment}`).join("")
    : normalized

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return null
  }

  return { red, green, blue }
}

function getCompanyCardStyle(hexColor: string): CSSProperties | undefined {
  const rgb = hexToRgb(hexColor)

  if (!rgb) {
    return undefined
  }

  return {
    backgroundColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.10)`,
  }
}

export function ProfileSalaryByCompanyTable({
  companies,
  locale,
  labels,
  compensationLabels,
  notAvailableLabel,
}: ProfileSalaryByCompanyTableProps) {
  return (
    <>
      <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
        {companies.map((companySalary) => {
          const monthlyValue = getMonthlyEquivalentValue(companySalary, locale, notAvailableLabel)
          const annualValue = getAnnualizedSalaryValue(companySalary, locale, notAvailableLabel)
          const compensationValue = getCompensationTypeLabel(
            companySalary.compensationType,
            compensationLabels
          )

          return (
            <article
              key={companySalary.pathCompanyId}
              className="rounded-xl border border-border/50 px-3 py-3 backdrop-blur-[1px]"
              style={getCompanyCardStyle(companySalary.color)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-5 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: companySalary.color }}
                  aria-hidden
                />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {companySalary.displayName}
                </p>
              </div>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {companySalary.roleDisplayName}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-background/75 px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {labels.compensationType}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {compensationValue}
                  </p>
                </div>
                <div className="rounded-lg bg-background/75 px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {labels.eventCount}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                    {formatNumber(locale, companySalary.eventCount, 0)}
                  </p>
                </div>
                <div className="rounded-lg bg-background/75 px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {labels.monthlyEquivalent}
                  </p>
                  <p
                    className={`mt-0.5 text-sm font-semibold tabular-nums ${
                      companySalary.monthlyEquivalent === null ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {monthlyValue}
                  </p>
                </div>
                <div className="rounded-lg bg-background/75 px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {labels.annualizedSalary}
                  </p>
                  <p
                    className={`mt-0.5 text-sm font-semibold tabular-nums ${
                      companySalary.annualizedSalary === null ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {annualValue}
                  </p>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="space-y-1 md:hidden">
        {companies.map((companySalary) => (
          <article
            key={companySalary.pathCompanyId}
            className="rounded-lg px-2.5 py-2"
            style={getCompanyCardStyle(companySalary.color)}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-5 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: companySalary.color }}
                aria-hidden
              />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {companySalary.displayName}
              </p>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {getMonthlyEquivalentValue(companySalary, locale, notAvailableLabel)}
              </p>
            </div>

            <div className="mt-1 pl-3">
              <p className="truncate text-xs text-muted-foreground">
                {companySalary.roleDisplayName} ·{" "}
                {getCompensationTypeLabel(companySalary.compensationType, compensationLabels)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {labels.annualizedSalary}: {getAnnualizedSalaryValue(companySalary, locale, notAvailableLabel)}
                </span>{" "}
                <span className="mx-1">·</span>
                <span className="tabular-nums">
                  {labels.eventCount}: {formatNumber(locale, companySalary.eventCount, 0)}
                </span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
