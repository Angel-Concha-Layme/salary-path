"use client"

import dynamic from "next/dynamic"

const SalaryProgressionPreviewChart = dynamic(
  () =>
    import("@/components/charts/salary-progression-preview-chart").then(
      (mod) => mod.SalaryProgressionPreviewChart
    ),
  {
    ssr: false,
    loading: () => null,
  }
)

interface SignInHeroPanelProps {
  locale: string
  brandLabel: string
  heroTitle: string
  heroBody: string
  heroCardTitle: string
  heroCardBody: string
  chartSalaryLabel: string
  chartCompanyLabel: string
  chartEventTypeLabel: string
  chartIncreaseLabel: string
  chartPeriodLabel: string
  chartDateLabel: string
}

export function SignInHeroPanel({
  locale,
  brandLabel,
  heroTitle,
  heroBody,
  heroCardTitle,
  heroCardBody,
  chartSalaryLabel,
  chartCompanyLabel,
  chartEventTypeLabel,
  chartIncreaseLabel,
  chartPeriodLabel,
  chartDateLabel,
}: SignInHeroPanelProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-2rem)] w-full max-w-[1080px] flex-col overflow-hidden rounded-3xl border border-zinc-200/10 bg-zinc-950 p-8 text-zinc-100 shadow-2xl xl:min-h-[calc(100vh-3rem)] xl:p-10">
      <div className="absolute -left-16 top-8 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute bottom-6 right-[-88px] h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_24%,rgba(255,255,255,0.1),transparent_34%),radial-gradient(circle_at_82%_84%,rgba(255,255,255,0.12),transparent_32%)]" />

      <div className="relative space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">{brandLabel}</p>
        <h2 className="max-w-2xl text-4xl leading-tight font-semibold xl:text-5xl">{heroTitle}</h2>
        <p className="max-w-2xl text-lg leading-relaxed text-zinc-300">{heroBody}</p>
      </div>

      <div className="relative mt-auto rounded-3xl border border-zinc-200/20 bg-white p-7 text-slate-900 shadow-2xl xl:p-8">
        <h3 className="text-4xl leading-tight font-semibold xl:text-5xl">{heroCardTitle}</h3>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">{heroCardBody}</p>
        <SalaryProgressionPreviewChart
          locale={locale}
          salaryLabel={chartSalaryLabel}
          companyLabel={chartCompanyLabel}
          eventTypeLabel={chartEventTypeLabel}
          increaseLabel={chartIncreaseLabel}
          periodLabel={chartPeriodLabel}
          dateLabel={chartDateLabel}
        />
      </div>
    </div>
  )
}
