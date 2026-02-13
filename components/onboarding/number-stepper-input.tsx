"use client"

import { MinusIcon, PlusIcon } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

interface NumberStepperInputProps {
  id: string
  name: string
  value: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  ariaInvalid?: boolean
  onBlur?: () => void
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

export function NumberStepperInput({
  id,
  name,
  value,
  min,
  max,
  step = 1,
  disabled,
  ariaInvalid,
  onBlur,
  onChange,
}: NumberStepperInputProps) {
  function setStep(delta: number) {
    const next = clamp(value + delta, min, max)
    onChange(next)
  }

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        name={name}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onBlur={onBlur}
        onChange={(event) => {
          const parsed = Number(event.target.value)

          if (Number.isNaN(parsed)) {
            return
          }

          onChange(clamp(parsed, min, max))
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
