"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addMonths,
  addWeeks,
  subMonths,
  subWeeks,
  eachDayOfInterval,
  format,
  getDay
} from "date-fns"

type CalendarView = "month" | "week" | "day"

interface MiniCalendarProps {
  view: CalendarView
  currentDate: Date
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  disabled?: { before: Date }[]
  t?: (key: string) => string
}

export function MiniCalendar({
  view,
  currentDate,
  selected,
  onSelect,
  className,
  disabled,
  t
}: MiniCalendarProps) {
  const [month, setMonth] = React.useState<Date>(currentDate)

  // Calculate selected range based on view
  const selectedRange = React.useMemo(() => {
    if (!selected) return undefined

    if (view === "month") {
      return {
        from: startOfMonth(selected),
        to: endOfMonth(selected)
      }
    } else if (view === "week") {
      return {
        from: startOfWeek(selected, { weekStartsOn: 1 }),
        to: endOfWeek(selected, { weekStartsOn: 1 })
      }
    } else {
      // Günlük görünüm için sadece seçili günü döndür
      return {
        from: selected,
        to: selected
      }
    }
  }, [view, selected])

  // Görünüm veya tarih değiştiğinde month state'ini güncelle
  React.useEffect(() => {
    if (view === "month") {
      setMonth(startOfMonth(currentDate))
    } else {
      setMonth(currentDate)
    }
  }, [currentDate, view])

  // Format month name using translation
  const formatCaption = (date: Date) => {
    const monthIndex = date.getMonth()
    const monthKey = [
      "january", "february", "march", "april",
      "may", "june", "july", "august",
      "september", "october", "november", "december"
    ][monthIndex]
    
    return t ? `${t(`admin-reservation.calendar.months.${monthKey}`)} ${date.getFullYear()}` : format(date, "MMMM yyyy")
  }

  // Get localized day names
  const dayNames = [
    t?.("admin-reservation.calendar.days.sunday") || "Sunday",
    t?.("admin-reservation.calendar.days.monday") || "Monday",
    t?.("admin-reservation.calendar.days.tuesday") || "Tuesday",
    t?.("admin-reservation.calendar.days.wednesday") || "Wednesday",
    t?.("admin-reservation.calendar.days.thursday") || "Thursday",
    t?.("admin-reservation.calendar.days.friday") || "Friday",
    t?.("admin-reservation.calendar.days.saturday") || "Saturday",
  ]

  // Format weekday name using translation
  const formatWeekdayName = (date: Date) => {
    const dayIndex = getDay(date)
    return dayNames[dayIndex]
  }

  // Handle month change
  const handleMonthChange = (newMonth: Date) => {
    if (view === "week") return // Haftalık görünümde ay değişikliğini engelle
    setMonth(newMonth)
    if (view === "month") {
      onSelect?.(startOfMonth(newMonth))
    }
  }

  // Handle day selection
  const handleSelect = (date: Date | undefined) => {
    if (!date) return

    if (view === "month") {
      const monthStart = startOfMonth(date)
      setMonth(monthStart)
      onSelect?.(monthStart)
    } else if (view === "week") {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 })
      setMonth(date)
      onSelect?.(weekStart)
    } else {
      setMonth(date)
      onSelect?.(date)
    }
  }

  // Custom navigation
  const handleNavigation = (action: "prev" | "next") => {
    if (view === "month") {
      const newDate = action === "prev" 
        ? subMonths(currentDate, 1) 
        : addMonths(currentDate, 1)
      const monthStart = startOfMonth(newDate)
      setMonth(monthStart)
      onSelect?.(monthStart)
    } else if (view === "week") {
      const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const newWeekStart = action === "prev"
        ? subWeeks(currentWeekStart, 1)
        : addWeeks(currentWeekStart, 1)
      setMonth(newWeekStart)
      onSelect?.(newWeekStart)
    } else {
      const newDate = action === "prev"
        ? subMonths(month, 1)
        : addMonths(month, 1)
      setMonth(newDate)
    }
  }

  // Modifiers for highlighting
  const modifiers = React.useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) return undefined

    if (view === "month") {
      const days = eachDayOfInterval({
        start: startOfMonth(selectedRange.from),
        end: endOfMonth(selectedRange.from)
      })
      return { selected: days }
    } else if (view === "week") {
      const days = eachDayOfInterval({
        start: startOfWeek(selectedRange.from, { weekStartsOn: 1 }),
        end: endOfWeek(selectedRange.from, { weekStartsOn: 1 })
      })
      return { selected: days }
    } else {
      // Günlük görünüm için sadece seçili günü vurgula
      return { selected: [selectedRange.from] }
    }
  }, [view, selectedRange])

  // Common props for DayPicker
  const commonProps = {
    showOutsideDays: true, // Tüm görünümlerde dış günleri göster
    className: cn("p-3", className),
    weekStartsOn: 1 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    month,
    onMonthChange: handleMonthChange,
    defaultMonth: currentDate,
    disabled,
    formatters: { 
      formatCaption,
      formatWeekdayName
    },
    hideHead: true,
    footer: null,
    classNames: {
      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
      month: "space-y-4",
      caption: "flex justify-center pt-1 relative items-center",
      caption_label: "text-sm font-medium",
      nav: "space-x-1 flex items-center",
      nav_button: cn(
        buttonVariants({ variant: "outline" }),
        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
      ),
      nav_button_previous: "absolute left-1",
      nav_button_next: "absolute right-1",
      table: "w-full border-collapse space-y-1",
      head_row: "flex",
      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
      row: "flex w-full mt-2",
      cell: cn(
        "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
        view === "week" ? "[&:has([aria-selected])]:rounded-none" : "[&:has([aria-selected])]:rounded-md"
      ),
      day: cn(
        buttonVariants({ variant: "ghost" }),
        "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
      ),
      day_range_end: "day-range-end",
      day_selected: cn(
        view === "day" 
          ? "bg-blue-900 text-white hover:bg-blue-800 hover:text-white focus:bg-blue-800 focus:text-white"
          : "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
      ),
      day_today: "border-2 border-primary font-semibold",
      day_outside: cn(
        "text-muted-foreground opacity-50",
        "hover:bg-accent hover:text-accent-foreground"
      ),
      day_disabled: "text-muted-foreground opacity-50",
      day_range_middle:
        "aria-selected:bg-accent aria-selected:text-accent-foreground",
      day_hidden: "invisible",
    },
    components: {
      IconLeft: () => (
        <ChevronLeft 
          className="h-4 w-4" 
          onClick={() => handleNavigation("prev")}
        />
      ),
      IconRight: () => (
        <ChevronRight 
          className="h-4 w-4" 
          onClick={() => handleNavigation("next")}
        />
      ),
    },
    modifiers,
    modifiersStyles: {
      selected: {
        backgroundColor: view === "day" ? 'rgb(30 58 138)' : 'var(--accent)',
        color: view === "day" ? 'white' : 'var(--accent-foreground)',
        borderRadius: view === "week" ? '0px' : undefined,
        fontWeight: view === "day" ? '600' : undefined
      }
    }
  }

  if (view === "day") {
    return (
      <DayPicker
        {...commonProps}
        mode="single"
        selected={selected}
        onSelect={handleSelect}
        disabled={undefined}
      />
    )
  }

  return (
    <DayPicker
      {...commonProps}
      mode="range"
      selected={selectedRange}
      onSelect={(range) => {
        if (range?.from) {
          if (view === "week") {
            const weekStart = startOfWeek(range.from, { weekStartsOn: 1 })
            handleSelect(weekStart)
          } else {
            handleSelect(range.from)
          }
        }
      }}
      disabled={disabled}
    />
  )
}

MiniCalendar.displayName = "MiniCalendar" 