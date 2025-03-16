"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ViewSwitcherProps {
  view: "month" | "week" | "day"
  onChange: (view: "month" | "week" | "day") => void
  t: (key: string) => string
}

export function ViewSwitcher({ view, onChange, t }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border p-1 h-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("month")}
        className={cn(
          "h-8",
          view === "month" && "bg-muted"
        )}
      >
        {t("admin-reservation.calendar.month")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("week")}
        className={cn(
          "h-8",
          view === "week" && "bg-muted"
        )}
      >
        {t("admin-reservation.calendar.week")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("day")}
        className={cn(
          "h-8",
          view === "day" && "bg-muted"
        )}
      >
        {t("admin-reservation.calendar.day")}
      </Button>
    </div>
  )
} 