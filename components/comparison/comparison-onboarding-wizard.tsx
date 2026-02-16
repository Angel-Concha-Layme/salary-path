"use client"

import { useMemo, useState } from "react"
import {
  Building2Icon,
  CheckCircle2Icon,
  NetworkIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { ComparisonTwoPeoplePreviewChart } from "@/components/comparison/comparison-two-people-preview-chart"
import { OnboardingWizardShell } from "@/components/onboarding/onboarding-wizard-shell"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TOTAL_STEPS = 3

interface ComparisonFeatureCard {
  key: "sameCompany" | "otherCompanies" | "similarPeople"
  icon: LucideIcon
  title: string
  description: string
}

export function ComparisonOnboardingWizard() {
  const { dictionary, locale } = useDictionary()
  const [step, setStep] = useState(0)
  const [hasAcceptedAnonymousShare, setHasAcceptedAnonymousShare] = useState(false)
  const [showConsentError, setShowConsentError] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const featureCards = useMemo<ComparisonFeatureCard[]>(
    () => [
      {
        key: "sameCompany",
        icon: Building2Icon,
        title: dictionary.comparisonOnboarding.preview.features.sameCompanyTitle,
        description: dictionary.comparisonOnboarding.preview.features.sameCompanyDescription,
      },
      {
        key: "otherCompanies",
        icon: NetworkIcon,
        title: dictionary.comparisonOnboarding.preview.features.otherCompaniesTitle,
        description: dictionary.comparisonOnboarding.preview.features.otherCompaniesDescription,
      },
      {
        key: "similarPeople",
        icon: TrendingUpIcon,
        title: dictionary.comparisonOnboarding.preview.features.similarPeopleTitle,
        description: dictionary.comparisonOnboarding.preview.features.similarPeopleDescription,
      },
    ],
    [dictionary]
  )

  const progressLabel = dictionary.comparisonOnboarding.stepProgress
    .replace("{current}", String(step + 1))
    .replace("{total}", String(TOTAL_STEPS))

  const stepTitle =
    step === 0
      ? dictionary.comparisonOnboarding.steps.consent
      : step === 1
        ? dictionary.comparisonOnboarding.steps.preview
        : dictionary.comparisonOnboarding.steps.ready

  function handleReset() {
    setStep(0)
    setHasAcceptedAnonymousShare(false)
    setShowConsentError(false)
    setIsCompleted(false)
  }

  function handleNextStep() {
    if (step === 0 && !hasAcceptedAnonymousShare) {
      setShowConsentError(true)
      return
    }

    setShowConsentError(false)
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1))
  }

  function handlePreviousStep() {
    setShowConsentError(false)
    setStep((current) => Math.max(current - 1, 0))
  }

  function handleFinish() {
    if (!hasAcceptedAnonymousShare) {
      setStep(0)
      setShowConsentError(true)
      return
    }

    setIsCompleted(true)
  }

  if (isCompleted) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-border bg-zinc-100 text-foreground dark:bg-zinc-950 dark:text-zinc-100">
        <div className="pointer-events-none absolute -top-24 left-[-72px] h-72 w-72 rounded-full bg-primary/12 blur-3xl dark:bg-primary/30" />
        <div className="pointer-events-none absolute bottom-[-120px] right-[-96px] h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/25" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(15,23,42,0.06),transparent_28%),radial-gradient(circle_at_84%_88%,rgba(15,23,42,0.06),transparent_30%)] dark:bg-[radial-gradient(circle_at_8%_10%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_84%_88%,rgba(255,255,255,0.12),transparent_30%)]" />
        <OnboardingWizardShell
          maxWidthClassName="max-w-5xl"
          containerClassName="z-10"
          outerPaddingClassName="p-2 sm:p-3 md:p-4"
          cardClassName="rounded-2xl border border-border bg-background p-8 md:p-10"
        >
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <SparklesIcon className="size-3.5" />
              {dictionary.comparisonOnboarding.wip.badge}
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {dictionary.comparisonOnboarding.wip.title}
            </h1>
            <p className="mt-3 whitespace-normal text-sm leading-relaxed text-muted-foreground md:text-base">
              {dictionary.comparisonOnboarding.wip.description}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-medium">{dictionary.comparisonOnboarding.wip.items.sameCompany}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-medium">{dictionary.comparisonOnboarding.wip.items.otherCompanies}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-medium">{dictionary.comparisonOnboarding.wip.items.similarPeople}</p>
              </div>
            </div>

            <div className="mt-8">
              <Button type="button" variant="outline" onClick={handleReset}>
                {dictionary.comparisonOnboarding.actions.startOver}
              </Button>
            </div>
        </OnboardingWizardShell>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-zinc-100 text-foreground dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none absolute -top-24 left-[-72px] h-72 w-72 rounded-full bg-primary/12 blur-3xl dark:bg-primary/30" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-96px] h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/25" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(15,23,42,0.06),transparent_28%),radial-gradient(circle_at_84%_88%,rgba(15,23,42,0.06),transparent_30%)] dark:bg-[radial-gradient(circle_at_8%_10%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_84%_88%,rgba(255,255,255,0.12),transparent_30%)]" />
      <OnboardingWizardShell
        maxWidthClassName="max-w-6xl"
        containerClassName="z-10"
        outerPaddingClassName="p-2 sm:p-3 md:p-4"
        cardClassName="rounded-2xl border border-border bg-background text-card-foreground"
      >
          <div className="border-b border-border p-6 pb-4 md:p-8 md:pb-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Salary Path</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {dictionary.comparisonOnboarding.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {dictionary.comparisonOnboarding.subtitle}
            </p>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{progressLabel}</span>
                <span>{step + 1}/{TOTAL_STEPS}</span>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(0, 1fr))` }}>
                {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                  <div
                    key={index}
                    className={cn("h-1.5 rounded-full bg-muted transition-colors", index <= step && "bg-primary")}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold tracking-tight">{stepTitle}</h2>

              {step === 0 ? (
                <div className="space-y-4">
                  <p className="whitespace-normal text-sm leading-relaxed text-muted-foreground md:text-base">
                    {dictionary.comparisonOnboarding.consent.description}
                  </p>

                  <div className="rounded-xl border border-border/70 bg-background/80 p-4 md:p-5">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold">
                      <ShieldCheckIcon className="size-4 text-primary" />
                      {dictionary.comparisonOnboarding.consent.commitmentsTitle}
                    </p>

                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                      <li>{dictionary.comparisonOnboarding.consent.commitments.anonymity}</li>
                      <li>{dictionary.comparisonOnboarding.consent.commitments.permissionOnly}</li>
                      <li>{dictionary.comparisonOnboarding.consent.commitments.revokeAnytime}</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      hasAcceptedAnonymousShare
                        ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                        : "border-border/70 bg-background/70"
                    )}
                    onClick={() => {
                      setHasAcceptedAnonymousShare((value) => !value)
                      setShowConsentError(false)
                    }}
                    aria-pressed={hasAcceptedAnonymousShare}
                  >
                    <span className="text-sm font-medium">
                      {dictionary.comparisonOnboarding.consent.acceptAction}
                    </span>
                    <span
                      className={cn(
                        "inline-flex size-5 items-center justify-center rounded-full border",
                        hasAcceptedAnonymousShare
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-muted-foreground/40 text-muted-foreground"
                      )}
                    >
                      <CheckCircle2Icon className="size-3.5" />
                    </span>
                  </button>

                  {showConsentError ? (
                    <p className="text-sm font-medium text-destructive">
                      {dictionary.comparisonOnboarding.consent.requiredError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-5">
                  <p className="whitespace-normal text-sm leading-relaxed text-muted-foreground md:text-base">
                    {dictionary.comparisonOnboarding.preview.description}
                  </p>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-start">
                    <div className="rounded-[24px] border border-border/70 bg-background/70 p-2 md:rounded-[28px] md:p-3">
                      <ComparisonTwoPeoplePreviewChart
                        locale={locale}
                        periodLabel={dictionary.comparisonOnboarding.chart.periodLabel}
                        dateLabel={dictionary.comparisonOnboarding.chart.dateLabel}
                        companyLabel={dictionary.comparisonOnboarding.chart.companyLabel}
                        eventLabel={dictionary.comparisonOnboarding.chart.eventLabel}
                        personOneLabel={dictionary.comparisonOnboarding.chart.personOneLabel}
                        personTwoLabel={dictionary.comparisonOnboarding.chart.personTwoLabel}
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      {featureCards.map((card) => (
                        <div key={card.key} className="rounded-xl border border-border/70 bg-background/80 p-4">
                          <p className="inline-flex items-center gap-2 text-sm font-semibold">
                            <card.icon className="size-4 text-primary" />
                            {card.title}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <p className="whitespace-normal text-sm leading-relaxed text-muted-foreground md:text-base">
                    {dictionary.comparisonOnboarding.ready.description}
                  </p>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                      <p className="text-sm font-medium">{dictionary.comparisonOnboarding.ready.items.sameCompany}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                      <p className="text-sm font-medium">
                        {dictionary.comparisonOnboarding.ready.items.otherCompanies}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                      <p className="text-sm font-medium">{dictionary.comparisonOnboarding.ready.items.similarPeople}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">{dictionary.comparisonOnboarding.ready.uiOnlyHint}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={handleReset}>
                {dictionary.comparisonOnboarding.actions.reset}
              </Button>

              <div className="flex items-center gap-2">
                {step > 0 ? (
                  <Button type="button" variant="outline" onClick={handlePreviousStep}>
                    {dictionary.comparisonOnboarding.actions.previous}
                  </Button>
                ) : null}

                {step < TOTAL_STEPS - 1 ? (
                  <Button type="button" className="hover:bg-primary/90" onClick={handleNextStep}>
                    {dictionary.comparisonOnboarding.actions.next}
                  </Button>
                ) : (
                  <Button type="button" className="hover:bg-primary/90" onClick={handleFinish}>
                    {dictionary.comparisonOnboarding.actions.finish}
                  </Button>
                )}
              </div>
            </div>
          </div>
      </OnboardingWizardShell>
    </section>
  )
}
