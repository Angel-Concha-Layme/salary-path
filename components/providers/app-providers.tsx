"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"

import { Toaster } from "@/components/notifications/toaster"
import { DictionaryProvider } from "@/app/lib/i18n/dictionary-context"
import type { AppLocale } from "@/app/lib/i18n/locales"

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 10,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

interface AppProvidersProps {
  children: React.ReactNode
  locale: AppLocale
}

export function AppProviders({ children, locale }: AppProvidersProps) {
  const [queryClient] = useState(createAppQueryClient)

  return (
    <DictionaryProvider initialLocale={locale}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </DictionaryProvider>
  )
}
