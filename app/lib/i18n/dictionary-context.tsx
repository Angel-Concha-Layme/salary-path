"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

import type { AppLocale } from "@/app/lib/i18n/locales"
import { getDictionary, type Dictionary } from "@/app/lib/i18n/get-dictionary"

interface DictionaryContextValue {
  locale: AppLocale
  dictionary: Dictionary
  setLocale: (locale: AppLocale) => void
}

const DictionaryContext = createContext<DictionaryContextValue | null>(null)

interface DictionaryProviderProps {
  initialLocale: AppLocale
  children: ReactNode
}

export function DictionaryProvider({ initialLocale, children }: DictionaryProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale)
  const [dictionary, setDictionary] = useState<Dictionary>(() => getDictionary(initialLocale))

  const setLocale = useCallback((newLocale: AppLocale) => {
    setLocaleState(newLocale)
    setDictionary(getDictionary(newLocale))
  }, [])

  return (
    <DictionaryContext.Provider value={{ locale, dictionary, setLocale }}>
      {children}
    </DictionaryContext.Provider>
  )
}

export function useDictionary() {
  const context = useContext(DictionaryContext)
  
  if (!context) {
    throw new Error("useDictionary must be used within DictionaryProvider")
  }
  
  return context
}
