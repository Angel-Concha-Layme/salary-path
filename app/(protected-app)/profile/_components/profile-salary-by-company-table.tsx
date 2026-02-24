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
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-[0.08em] text-foreground">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                {labels.displayName}
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                {labels.roleDisplayName}
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                {labels.compensationType}
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                {labels.monthlyEquivalent}
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                {labels.annualizedSalary}
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                {labels.eventCount}
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.map((companySalary) => (
              <tr
                key={companySalary.pathCompanyId}
                className="border-t border-border/70 align-top text-foreground transition-colors hover:bg-accent/40"
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
                  {getCompensationTypeLabel(companySalary.compensationType, compensationLabels)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {getMonthlyEquivalentValue(companySalary, locale, notAvailableLabel)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {getAnnualizedSalaryValue(companySalary, locale, notAvailableLabel)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {formatNumber(locale, companySalary.eventCount, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
