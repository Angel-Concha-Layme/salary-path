"use client"

import Link from "next/link"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { RouteScreen } from "@/components/layout/route-screen"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function HomeWorkspace() {
  const { dictionary } = useDictionary()

  return (
    <RouteScreen
      title={dictionary.homePage.title}
      subtitle={dictionary.homePage.subtitle}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border/80">
          <CardHeader>
            <CardTitle>{dictionary.homePage.cards.careerPathTitle}</CardTitle>
            <CardDescription>{dictionary.homePage.cards.careerPathDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm text-primary hover:underline" href="/career-path/salary-tracking">
              {dictionary.navigation.salaryTracking}
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-border/80">
          <CardHeader>
            <CardTitle>{dictionary.homePage.cards.financialEngineTitle}</CardTitle>
            <CardDescription>{dictionary.homePage.cards.financialEngineDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm text-primary hover:underline" href="/financial-engine/taxes-peru">
              {dictionary.navigation.taxesPeru}
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-border/80">
          <CardHeader>
            <CardTitle>{dictionary.homePage.cards.homePathTitle}</CardTitle>
            <CardDescription>{dictionary.homePage.cards.homePathDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm text-primary hover:underline" href="/home-path/mortgage-eligibility">
              {dictionary.navigation.mortgageEligibility}
            </Link>
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/80">
        <CardHeader>
          <CardTitle>{dictionary.homePage.quickStartTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. {dictionary.homePage.quickStartStepOne}</p>
          <p>2. {dictionary.homePage.quickStartStepTwo}</p>
          <p>3. {dictionary.homePage.quickStartStepThree}</p>
        </CardContent>
      </Card>
    </RouteScreen>
  )
}
