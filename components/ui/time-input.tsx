"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Clock3Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TimeInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  ariaInvalid?: boolean
  className?: string
  onBlur?: () => void
}

function parseTimeValue(value: string): { hour: number; minute: number } | null {
  const normalized = value.trim()

  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return null
  }

  const [hourPart, minutePart] = normalized.split(":")
  const hour = Number(hourPart)
  const minute = Number(minutePart)

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  return { hour, minute }
}

function formatTimeValue(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute)

export function TimeInput({
  id,
  value,
  onChange,
  disabled = false,
  ariaInvalid = false,
  className,
  onBlur,
}: TimeInputProps) {
  const [open, setOpen] = useState(false)
  const parsedValue = useMemo(() => parseTimeValue(value), [value])
  const selectedHour = parsedValue?.hour ?? null
  const selectedMinute = parsedValue?.minute ?? null
  const hourRefs = useRef<Array<HTMLButtonElement | null>>([])
  const minuteRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    if (!open) {
      return
    }

    if (selectedHour !== null) {
      hourRefs.current[selectedHour]?.scrollIntoView({ block: "center" })
    }

    if (selectedMinute !== null) {
      minuteRefs.current[selectedMinute]?.scrollIntoView({ block: "center" })
    }
  }, [open, selectedHour, selectedMinute])

  function commit(nextHour: number, nextMinute: number, closeOnCommit = false) {
    onChange(formatTimeValue(nextHour, nextMinute))

    if (closeOnCommit) {
      setOpen(false)
    }
  }

  const displayValue =
    selectedHour !== null && selectedMinute !== null
      ? formatTimeValue(selectedHour, selectedMinute)
      : "--:--"

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (!nextOpen) {
          onBlur?.()
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          data-invalid={ariaInvalid || undefined}
          disabled={disabled}
          className={cn(
            "border-input dark:bg-input/30 dark:hover:bg-input/50 data-[invalid=true]:ring-destructive/20 dark:data-[invalid=true]:ring-destructive/40 data-[invalid=true]:border-destructive dark:data-[invalid=true]:border-destructive/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-left text-base transition-colors outline-none md:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)]",
            "focus-visible:border-[color-mix(in_oklch,var(--ui-accent-current)_55%,var(--border))]",
            "focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklch,var(--ui-accent-current)_28%,transparent)]",
            "flex items-center justify-between gap-2",
            className
          )}
        >
          <span
            className={cn(
              "tabular-nums",
              selectedHour === null || selectedMinute === null ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {displayValue}
          </span>
          <Clock3Icon className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[196px] rounded-lg border border-border/80 bg-card/95 p-2 shadow-xl backdrop-blur-sm"
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="px-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">HH</p>
            <div className="no-scrollbar max-h-48 overflow-y-auto rounded-md border border-border/70 bg-background/70 p-1">
              {HOURS.map((hour) => {
                const isSelected = hour === selectedHour

                return (
                  <button
                    key={hour}
                    type="button"
                    ref={(node) => {
                      hourRefs.current[hour] = node
                    }}
                    onClick={() => commit(hour, selectedMinute ?? 0)}
                    className={cn(
                      "h-8 w-full rounded-md px-2 text-center text-sm tabular-nums transition-colors outline-none",
                      "hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_12%,transparent)]",
                      "focus-visible:bg-[color-mix(in_oklch,var(--ui-accent-current)_16%,transparent)]",
                      isSelected &&
                        "bg-[color-mix(in_oklch,var(--ui-accent-current)_28%,transparent)] ring-1 ring-[color-mix(in_oklch,var(--ui-accent-current)_42%,transparent)]"
                    )}
                  >
                    {hour.toString().padStart(2, "0")}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1">
            <p className="px-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">MM</p>
            <div className="no-scrollbar max-h-48 overflow-y-auto rounded-md border border-border/70 bg-background/70 p-1">
              {MINUTES.map((minute) => {
                const isSelected = minute === selectedMinute

                return (
                  <button
                    key={minute}
                    type="button"
                    ref={(node) => {
                      minuteRefs.current[minute] = node
                    }}
                    onClick={() => commit(selectedHour ?? 0, minute, true)}
                    className={cn(
                      "h-8 w-full rounded-md px-2 text-center text-sm tabular-nums transition-colors outline-none",
                      "hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_12%,transparent)]",
                      "focus-visible:bg-[color-mix(in_oklch,var(--ui-accent-current)_16%,transparent)]",
                      isSelected &&
                        "bg-[color-mix(in_oklch,var(--ui-accent-current)_28%,transparent)] ring-1 ring-[color-mix(in_oklch,var(--ui-accent-current)_42%,transparent)]"
                    )}
                  >
                    {minute.toString().padStart(2, "0")}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
