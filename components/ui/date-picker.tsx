"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface DatePickerProps {
  /**
   * The selected date value
   */
  value?: string | Date
  /**
   * Callback when date is selected
   */
  onChange?: (date: string | undefined) => void
  /**
   * Placeholder text when no date is selected
   */
  placeholder?: string
  /**
   * Whether the picker is disabled
   */
  disabled?: boolean
  /**
   * Start year for the year dropdown (default: 1950)
   */
  fromYear?: number
  /**
   * End year for the year dropdown (default: current year + 10)
   */
  toYear?: number
  /**
   * Display format for the selected date (default: 'PPP')
   */
  displayFormat?: string
  /**
   * Custom className for the button
   */
  className?: string
}

/**
 * DatePicker Component
 *
 * A reusable date picker with dropdown year/month selectors.
 * Uses a constrained year range to keep the dropdown at a reasonable size.
 *
 * @example
 * ```tsx
 * <DatePicker
 *   value={birthday}
 *   onChange={(date) => setBirthday(date)}
 *   placeholder="Select date of birth"
 *   fromYear={1950}
 *   toYear={2015}
 * />
 * ```
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  fromYear = 1950,
  toYear = new Date().getFullYear() + 10,
  displayFormat = "PPP",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Convert value to Date object
  const selectedDate = value ? new Date(value) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (onChange) {
      // Format as YYYY-MM-DD for consistency
      onChange(date ? format(date, 'yyyy-MM-dd') : undefined)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal h-11',
            !selectedDate && 'text-muted-foreground',
            className
          )}
          aria-label={placeholder}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, displayFormat) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={handleSelect}
          disabled={disabled}
          captionLayout="dropdown"
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(toYear, 11)}
        />
      </PopoverContent>
    </Popover>
  )
}
