"use client"

import { useState, type ComponentProps } from "react"
import { format } from "date-fns"
import { CalendarIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SingleDatePickerFieldProps {
  id: string
  value: Date | null
  onChange: (value: Date | null) => void
  placeholder: string
  ariaInvalid?: boolean
  disabled?: boolean
  onBlur?: () => void
  startMonth?: Date
  endMonth?: Date
  allowClear?: boolean
  clearLabel?: string
  disabledDays?: ComponentProps<typeof Calendar>["disabled"]
}

export function SingleDatePickerField({
  id,
  value,
  onChange,
  placeholder,
  ariaInvalid,
  disabled,
  onBlur,
  startMonth = new Date(1970, 0),
  endMonth = new Date(new Date().getFullYear() + 1, 11),
  allowClear = false,
  clearLabel = "Clear date",
  disabledDays,
}: SingleDatePickerFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
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
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={ariaInvalid}
            disabled={disabled}
            className={cn(
              "h-10 w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "LLL dd, y") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            defaultMonth={value ?? undefined}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            disabled={disabledDays}
            autoFocus
            onSelect={(selectedDate) => {
              onChange(selectedDate ?? null)
              if (selectedDate) {
                setOpen(false)
              }
            }}
          />
        </PopoverContent>
      </Popover>

      {allowClear && value ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            onChange(null)
            onBlur?.()
          }}
          aria-label={clearLabel}
        >
          <XIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}
