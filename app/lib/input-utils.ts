/**
 * Normalizes a raw string from a number input to prevent leading zeros (e.g. "011")
 * and invalid characters. Returns `null` if the input should be rejected (no state update),
 * or the cleaned string otherwise.
 */
export function normalizeNonNegativeAmountInput(rawValue: string): string | null {
  const value = rawValue.trim()

  if (value.length === 0) {
    return ""
  }

  if (!/^\d*\.?\d*$/.test(value)) {
    return null
  }

  if (value === ".") {
    return "0."
  }

  const [integerPartRaw = "", decimalPartRaw] = value.split(".")
  const normalizedIntegerPart = integerPartRaw.replace(/^0+(?=\d)/, "") || "0"
  const hasDecimalPart = decimalPartRaw !== undefined
  const normalizedValue = hasDecimalPart
    ? `${normalizedIntegerPart}.${decimalPartRaw}`
    : normalizedIntegerPart

  const parsed = Number(normalizedValue)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return normalizedValue
}

/**
 * Returns a `FocusEventHandler<HTMLInputElement>` that auto-selects the content
 * when the current numeric value is zero, so typing replaces it instead of
 * producing values like "02".
 */
export function selectInputOnZeroFocus(currentValue: number) {
  return (event: React.FocusEvent<HTMLInputElement>) => {
    if (currentValue !== 0) {
      return
    }

    const inputElement = event.currentTarget
    requestAnimationFrame(() => {
      inputElement.select()
    })
  }
}
