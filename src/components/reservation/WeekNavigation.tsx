"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface WeekNavigationProps {
  weekStart: Date
  weekEnd: Date
  handlePrevWeek: () => void
  handleNextWeek: () => void
}

export function WeekNavigation({
  weekStart,
  weekEnd,
  handlePrevWeek,
  handleNextWeek
}: WeekNavigationProps) {
  return (
    <div className="flex justify-center items-center gap-4 mb-4">
      <Button onClick={handlePrevWeek} size="icon" variant="outline">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-lg font-semibold text-center min-w-[200px]">
        <span className="hidden md:inline">{format(weekStart, "MMM d, yyyy")} - {format(weekEnd, "MMM d, yyyy")}</span>
        <span className="md:hidden">{format(weekStart, "MMM d")} - {format(weekEnd, "MMM d")}</span>
      </h2>
      <Button onClick={handleNextWeek} size="icon" variant="outline">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
} 