function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function omitNullValuesDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => omitNullValuesDeep(entry)) as T
  }

  if (!isPlainObject(value)) {
    return value
  }

  const nextEntries: Array<[string, unknown]> = []

  for (const [key, entry] of Object.entries(value)) {
    if (entry === null) {
      continue
    }

    nextEntries.push([key, omitNullValuesDeep(entry)])
  }

  return Object.fromEntries(nextEntries) as T
}
