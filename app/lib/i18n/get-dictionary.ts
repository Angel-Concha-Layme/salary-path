import type { AppLocale } from "@/app/lib/i18n/locales"
import { enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { esDictionary } from "@/app/lib/i18n/dictionaries/es"

type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? DeepStringRecord<T[K]>
    : string
}

export type Dictionary = DeepStringRecord<typeof esDictionary>

const DICTIONARIES: Record<AppLocale, Dictionary> = {
  es: esDictionary,
  en: enDictionary,
}

export function getDictionary(locale: AppLocale): Dictionary {
  return DICTIONARIES[locale]
}
