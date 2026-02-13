"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangeFieldProps {
  id: string
  from: Date | null
  to: Date | null
  disabled?: boolean
  ariaInvalid?: boolean
  placeholder: string
  onChange: (range: { from: Date | null; to: Date | null }) => void
}

export function DateRangeField({
  id,
  from,
  to,
  disabled,
  ariaInvalid,
  placeholder,
  onChange,
}: DateRangeFieldProps) {
  const selectedRange = React.useMemo<DateRange | undefined>(
    () => ({
      from: from ?? undefined,
      to: to ?? undefined,
    }),
    [from, to]
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          type="button"
          className="h-10 w-full justify-start px-3 text-left font-normal"
          disabled={disabled}
          aria-invalid={ariaInvalid}
        >
          <CalendarIcon className="mr-2 size-4" />
          {from ? (
            to ? (
              <>
                {format(from, "LLL dd, y")} - {format(to, "LLL dd, y")}
              </>
            ) : (
              format(from, "LLL dd, y")
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={from ?? undefined}
          selected={selectedRange}
          onSelect={(nextRange) =>
            onChange({
              from: nextRange?.from ?? null,
              to: nextRange?.to ?? null,
            })
          }
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
