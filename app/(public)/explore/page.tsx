"use client"

import Link from "next/link"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExplorePage() {
  const { dictionary } = useDictionary()

  const modules = [
    {
      key: "careerPath",
      title: dictionary.exploreLanding.modules.careerPath.title,
      body: dictionary.exploreLanding.modules.careerPath.body,
      items: [
        dictionary.exploreLanding.modules.careerPath.items.salaryTracking,
        dictionary.exploreLanding.modules.careerPath.items.comparison,
        dictionary.exploreLanding.modules.careerPath.items.growthPrediction,
      ],
    },
    {
      key: "financialEngine",
      title: dictionary.exploreLanding.modules.financialEngine.title,
      body: dictionary.exploreLanding.modules.financialEngine.body,
      items: [
        dictionary.exploreLanding.modules.financialEngine.items.taxesPeru,
        dictionary.exploreLanding.modules.financialEngine.items.savingsProjection,
        dictionary.exploreLanding.modules.financialEngine.items.investmentSimulator,
        dictionary.exploreLanding.modules.financialEngine.items.taxStrategies,
      ],
    },
    {
      key: "homePath",
      title: dictionary.exploreLanding.modules.homePath.title,
      body: dictionary.exploreLanding.modules.homePath.body,
      items: [
        dictionary.exploreLanding.modules.homePath.items.mortgageEligibility,
        dictionary.exploreLanding.modules.homePath.items.installmentSimulator,
        dictionary.exploreLanding.modules.homePath.items.projectsMap,
        dictionary.exploreLanding.modules.homePath.items.financialMatching,
      ],
    },
  ] as const

  return (
    <div className="min-h-screen bg-background px-6 py-10 md:px-10 md:py-16">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="rounded-3xl border border-primary/25 bg-primary/5 p-6 md:p-10">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            {dictionary.exploreLanding.badge}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {dictionary.exploreLanding.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
            {dictionary.exploreLanding.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="#modules">{dictionary.exploreLanding.ctaPrimary}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">{dictionary.exploreLanding.ctaSecondary}</Link>
            </Button>
          </div>
        </section>

        <section id="modules" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {dictionary.exploreLanding.modulesTitle}
          </h2>

          <div className="grid gap-4 lg:grid-cols-3">
            {modules.map((module) => (
              <Card key={module.key} className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">{module.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{module.body}</p>
                  <ul className="space-y-1 text-sm text-foreground">
                    {module.items.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
