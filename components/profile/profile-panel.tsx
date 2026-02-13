"use client"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { useMeQuery } from "@/app/hooks/user/use-me-query"
import { ApiClientError } from "@/app/types/api"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function StateCard({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export function ProfilePanel() {
  const { dictionary } = useDictionary()
  const meQuery = useMeQuery()
  const user = meQuery.data?.user
  const source = meQuery.data?.source

  if (meQuery.isLoading) {
    return <StateCard title={dictionary.navigation.profile} message={dictionary.common.loading} />
  }

  if (meQuery.isError) {
    const errorMessage =
      meQuery.error instanceof ApiClientError
        ? meQuery.error.message
        : dictionary.common.unknownError

    return <StateCard title={dictionary.errors.pageTitle} message={errorMessage} />
  }

  if (!user?.id) {
    return <StateCard title={dictionary.navigation.profile} message={dictionary.errors.notFoundBody} />
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.navigation.profile}</CardTitle>
          <CardDescription>{dictionary.permissions.protected}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-muted-foreground">{dictionary.auth.name}</span>
            <span>{user.name}</span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-muted-foreground">{dictionary.auth.email}</span>
            <span>{user.email}</span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {dictionary.permissions.accessLabel}
            </span>
            <Badge variant="outline">{user.role}</Badge>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {dictionary.placeholders.scopeLabel}
            </span>
            <Badge variant="secondary">{source ?? "-"}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
