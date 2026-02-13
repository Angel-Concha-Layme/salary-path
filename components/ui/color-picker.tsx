"use client"

import { forwardRef, useMemo, useState, type ComponentProps } from "react"
import { HexColorPicker } from "react-colorful"

import { cn } from "@/lib/utils"
import { useForwardedRef } from "@/lib/use-forwarded-ref"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<typeof Button>, "value" | "onChange" | "onBlur"> & ColorPickerProps
>(
  ({ disabled, value, onChange, onBlur, name, className, size, ...props }, forwardedRef) => {
    const ref = useForwardedRef(forwardedRef)
    const [open, setOpen] = useState(false)

    const parsedValue = useMemo(() => {
      if (!value) {
        return "#FFFFFF"
      }

      const next = value.trim()
      return HEX_COLOR_REGEX.test(next) ? next : "#FFFFFF"
    }, [value])

    return (
      <Popover
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            onBlur?.()
          }
        }}
        open={open}
      >
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            {...props}
            className={cn("inline-flex h-8 w-14 shrink-0", className)}
            name={name}
            onClick={() => setOpen(true)}
            size={size}
            style={{ backgroundColor: parsedValue }}
            type="button"
            variant="outline"
          >
            <span className="sr-only">{parsedValue}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 space-y-3">
          <HexColorPicker color={parsedValue} onChange={onChange} className="!w-full" />
          <Input
            maxLength={7}
            onChange={(event) => onChange(event.currentTarget.value)}
            ref={ref}
            value={value}
          />
        </PopoverContent>
      </Popover>
    )
  }
)

ColorPicker.displayName = "ColorPicker"

export { ColorPicker }
