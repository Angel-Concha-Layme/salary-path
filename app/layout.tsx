import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { getRequestLocale } from "@/app/lib/i18n/get-request-locale"
import { AppProviders } from "@/components/providers/app-providers"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Salary Path",
  description: "Professional salary progression modeling",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getRequestLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  )
}
