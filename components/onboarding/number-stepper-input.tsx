"use client"

import { MinusIcon, PlusIcon } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

interface NumberStepperInputProps {
  id: string
  name: string
  value: number
  className?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  ariaInvalid?: boolean
  onBlur?: () => void
  onClamp?: (payload: {
    attemptedValue: number
    clampedValue: number
    bound: "min" | "max"
  }) => void
  onChange: (value: number) => void
}

function clamp(value: number, min?: number, max?: number) {
  let next = value

  if (typeof min === "number") {
    next = Math.max(min, next)
  }

  if (typeof max === "number") {
    next = Math.min(max, next)
  }

  return next
}

function getClampBound(value: number, min?: number, max?: number): "min" | "max" | null {
  if (typeof max === "number" && value > max) {
    return "max"
  }

  if (typeof min === "number" && value < min) {
    return "min"
  }

  return null
}

export function NumberStepperInput({
  id,
  name,
  value,
  className,
  min,
  max,
  step = 1,
  disabled,
  ariaInvalid,
  onBlur,
  onClamp,
  onChange,
}: NumberStepperInputProps) {
  function setStep(delta: number) {
    const attemptedValue = value + delta
    const next = clamp(attemptedValue, min, max)
    onChange(next)

    const bound = getClampBound(attemptedValue, min, max)
    if (bound) {
      onClamp?.({
        attemptedValue,
        clampedValue: next,
        bound,
      })
    }
  }

  return (
    <InputGroup className={className}>
      <InputGroupInput
        id={id}
        name={name}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onBlur={onBlur}
        onFocus={(event) => {
          if (value !== 0) {
            return
          }

          const inputElement = event.currentTarget

          requestAnimationFrame(() => {
            inputElement.select()
          })
        }}
        onChange={(event) => {
          const parsed = Number(event.target.value)

          if (!Number.isFinite(parsed)) {
            return
          }

          const nextValue = clamp(parsed, min, max)
          onChange(nextValue)

          const bound = getClampBound(parsed, min, max)
          if (bound) {
            onClamp?.({
              attemptedValue: parsed,
              clampedValue: nextValue,
              bound,
            })
          }

          const normalizedValue = String(nextValue)
          if (event.currentTarget.value !== normalizedValue) {
            event.currentTarget.value = normalizedValue
          }
        }}
        aria-invalid={ariaInvalid}
        disabled={disabled}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setStep(-step)}
          disabled={disabled}
          aria-label="Decrease"
        >
          <MinusIcon className="size-3.5" />
        </InputGroupButton>
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setStep(step)}
          disabled={disabled}
          aria-label="Increase"
        >
          <PlusIcon className="size-3.5" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
