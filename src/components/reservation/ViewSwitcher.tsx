"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar, CalendarDays, CalendarRange } from "lucide-react"

interface ViewSwitcherProps {
  view: "month" | "week" | "day"
  onChange: (view: "month" | "week" | "day") => void
  t: (key: string) => string
}

export function ViewSwitcher({ view, onChange, t }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border p-1 h-10 bg-background">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("month")}
        className={cn(
          "h-8 flex-1 flex items-center justify-center gap-2",
          view === "month" && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        <Calendar className="h-4 w-4" />
        {t("admin-reservation.calendar.month")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("week")}
        className={cn(
          "h-8 flex-1 flex items-center justify-center gap-2",
          view === "week" && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        <CalendarRange className="h-4 w-4" />
        {t("admin-reservation.calendar.week")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("day")}
        className={cn(
          "h-8 flex-1 flex items-center justify-center gap-2",
          view === "day" && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        <CalendarDays className="h-4 w-4" />
        {t("admin-reservation.calendar.day")}
      </Button>
    </div>
  )
} 