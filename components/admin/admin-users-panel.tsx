"use client"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { useAdminUsersQuery } from "@/app/hooks/user/use-admin-users-query"
import { ApiClientError } from "@/app/types/api"
import { RouteScreen } from "@/components/layout/route-screen"
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
    <div className="mx-auto w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

function formatDate(value: string) {
  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleDateString()
}

export function AdminUsersPanel() {
  const { dictionary } = useDictionary()
  const usersQuery = useAdminUsersQuery({ limit: 50 })
  const title = dictionary.navigation.adminUsers
  const subtitle = dictionary.permissions.admin

  if (usersQuery.isLoading) {
    return (
      <RouteScreen title={title} subtitle={subtitle} isLoading>
        {null}
      </RouteScreen>
    )
  }

  if (usersQuery.isError) {
    const errorMessage =
      usersQuery.error instanceof ApiClientError
        ? usersQuery.error.message
        : dictionary.common.unknownError

    return (
      <RouteScreen title={title} subtitle={subtitle}>
        <StateCard title={dictionary.errors.pageTitle} message={errorMessage} />
      </RouteScreen>
    )
  }

  if (usersQuery.data.users.length === 0) {
    return (
      <RouteScreen title={title} subtitle={subtitle}>
        <StateCard title={title} message={dictionary.errors.notFoundBody} />
      </RouteScreen>
    )
  }

  return (
    <RouteScreen title={title} subtitle={subtitle}>
      <div className="mx-auto w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="outline">Total: {usersQuery.data.total}</Badge>
            <div className="space-y-2">
              {usersQuery.data.users.map((adminUser) => (
                <div
                  key={adminUser.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {adminUser.name ?? adminUser.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{adminUser.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{adminUser.role}</Badge>
                    <Badge variant="outline">{formatDate(adminUser.createdAt)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteScreen>
  )
}
