"use client"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { useAdminUsersQuery } from "@/app/hooks/user/use-admin-users-query"
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

  if (usersQuery.isPending) {
    return <StateCard title={dictionary.navigation.adminUsers} message={dictionary.common.loading} />
  }

  if (usersQuery.isError) {
    const errorMessage =
      usersQuery.error instanceof ApiClientError
        ? usersQuery.error.message
        : dictionary.common.unknownError

    return <StateCard title={dictionary.errors.pageTitle} message={errorMessage} />
  }

  if (usersQuery.data.users.length === 0) {
    return <StateCard title={dictionary.navigation.adminUsers} message={dictionary.errors.notFoundBody} />
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.navigation.adminUsers}</CardTitle>
          <CardDescription>{dictionary.permissions.admin}</CardDescription>
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
  )
}
