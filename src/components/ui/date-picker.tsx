"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string | Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value, onChange, placeholder = "Selecciona fecha", className, disabled }, ref) => {
    const [internalDate, setInternalDate] = React.useState<Date>()

    // Convert value prop to Date if it's a string, handling timezone properly
    const date = React.useMemo(() => {
      if (!value) return internalDate
      if (value instanceof Date) return value

      // Parse date string as local date to avoid timezone shifts
      // If value is "2025-10-15", we want exactly that date, not shifted by timezone
      if (typeof value === 'string') {
        const [year, month, day] = value.split('-').map(Number)
        return new Date(year, month - 1, day)
      }

      return new Date(value)
    }, [value, internalDate])

    const handleSelect = (newDate: Date | undefined) => {
      if (onChange) {
        onChange(newDate)
      } else {
        setInternalDate(newDate)
      }
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled}
            data-slot="date-picker-trigger"
            data-empty={!date}
            className={cn(
              "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors",
              className
            )}
          >
            <CalendarIcon className="text-muted-foreground" />
            {date ? (
              format(date, "dd/MM/yyyy", { locale: es })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          data-slot="date-picker-content"
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    )
  }
)

DatePicker.displayName = "DatePicker"

export { DatePicker }