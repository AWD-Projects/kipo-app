"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value?: string
  onChange?: (time: string) => void
}

const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }

    return (
      <Input
        ref={ref}
        type="time"
        value={value}
        onChange={handleChange}
        className={cn(
          "bg-muted/30 h-12 rounded-xl border-muted-foreground/20 focus:bg-background transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
          className
        )}
        {...props}
      />
    )
  }
)

TimePicker.displayName = "TimePicker"

export { TimePicker }
