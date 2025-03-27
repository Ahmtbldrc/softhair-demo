"use client"

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfDay, startOfWeek, endOfWeek } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ReservationWithDetails, StaffWithServices, Service } from "@/lib/types"
import { Clock, User, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useRef, useEffect, useCallback } from "react"

interface MonthCalendarProps {
  currentDate: Date
  reservations: ReservationWithDetails[]
  services: Service[]
  staffMembers: StaffWithServices[]
  selectedStaff: string | null
  onDateSelect: (date: Date) => void
  onReservationClick: (reservation: ReservationWithDetails) => void
  t: (key: string) => string
}

export function MonthCalendar({
  currentDate,
  reservations,
  services,
  staffMembers,
  selectedStaff,
  onReservationClick,
  t
}: MonthCalendarProps) {
  const [expandedDay, setExpandedDay] = useState<Date | null>(null)
  const [expandedDayRect, setExpandedDayRect] = useState<DOMRect | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [showOnLeft, setShowOnLeft] = useState<{[key: number]: boolean}>({})
  const reservationRefs = useRef<{[key: number]: HTMLDivElement | null}>({})

  const updateCardPosition = useCallback((reservationId: number) => {
    const element = reservationRefs.current[reservationId]
    if (!element) return

    // Get the column index (0-6) of the current element
    const cellElement = element.closest('[data-column-index]')
    const columnIndex = cellElement ? parseInt(cellElement.getAttribute('data-column-index') || '0') : 0

    // Always show on left for the last two columns (5 and 6)
    const shouldShowOnLeft = columnIndex >= 5

    setShowOnLeft(prev => {
      if (prev[reservationId] === shouldShowOnLeft) return prev
      return { ...prev, [reservationId]: shouldShowOnLeft }
    })
  }, [])

  // Update positions when window is resized
  useEffect(() => {
    const handleResize = () => {
      Object.keys(reservationRefs.current).forEach(id => {
        updateCardPosition(Number(id))
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateCardPosition])

  // Update positions when reservations change
  useEffect(() => {
    reservations.forEach(res => {
      if (reservationRefs.current[res.id]) {
        updateCardPosition(res.id)
      }
    })
  }, [reservations, updateCardPosition])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  
  // Get the first day of the first week of the month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  // Get the last day of the last week of the month
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  // Get all days that should be shown in the calendar
  const days = eachDayOfInterval({ 
    start: calendarStart, 
    end: calendarEnd 
  })

  // Group days into weeks
  const weeks = days.reduce<Date[][]>((weeks, day) => {
    if (weeks.length === 0 || weeks[weeks.length - 1].length === 7) {
      weeks.push([])
    }
    weeks[weeks.length - 1].push(day)
    return weeks
  }, [])

  // Get localized day names - Starting from Monday
  const dayNames = [
    t("admin-reservation.calendar.days.monday"),
    t("admin-reservation.calendar.days.tuesday"),
    t("admin-reservation.calendar.days.wednesday"),
    t("admin-reservation.calendar.days.thursday"),
    t("admin-reservation.calendar.days.friday"),
    t("admin-reservation.calendar.days.saturday"),
    t("admin-reservation.calendar.days.sunday")
  ]

  const getServiceColor = (reservationId: number, date: Date, reservationsForDay: ReservationWithDetails[]) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-lime-500",
      "bg-emerald-500",
      "bg-sky-500",
      "bg-violet-500",
      "bg-fuchsia-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-blue-600",
      "bg-green-600",
      "bg-purple-600",
      "bg-yellow-600",
      "bg-pink-600",
      "bg-indigo-600",
      "bg-red-600",
      "bg-orange-600",
      "bg-teal-600",
      "bg-cyan-600",
      "bg-lime-600",
      "bg-emerald-600",
      "bg-sky-600",
      "bg-violet-600",
      "bg-fuchsia-600",
      "bg-rose-600",
      "bg-amber-600",
      "bg-blue-400",
      "bg-green-400",
      "bg-purple-400",
      "bg-pink-400",
      "bg-indigo-400",
      "bg-red-400"
    ]
    
    // Find index of current reservation in day's reservations
    const indexInDay = reservationsForDay.findIndex(r => r.id === reservationId)
    
    // Use combination of date and index in day for color selection
    const dateNum = date.getDate() + date.getMonth() * 31
    const colorIndex = (dateNum + indexInDay * 7) % colors.length
    
    return colors[colorIndex]
  }

  const getReservationsForDate = (date: Date) => {
    const dayStart = startOfDay(date)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    return reservations.filter(res => {
      const resDate = new Date(res.start ?? "")
      return resDate >= dayStart && 
             resDate <= dayEnd && 
             (!selectedStaff || selectedStaff === "all" || res.staffId === Number(selectedStaff))
    })
  }

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div ref={calendarRef} className="rounded-lg overflow-hidden border bg-background">
        {/* Day Names Header */}
        <div className="grid grid-cols-7 border-b">
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={cn(
                "py-2 text-center text-sm font-medium text-muted-foreground",
                [5, 6].includes(index) && "text-red-600/70" // Weekend days
              )}
            >
              <span className="md:hidden">{day.slice(0, 1)}</span>
              <span className="hidden md:inline">{day.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid grid-rows-[repeat(6,minmax(8rem,1fr))]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((day, dayIndex) => {
                const dayReservations = getReservationsForDate(day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isWeekend = [6, 0].includes(day.getDay())

                return (
                  <div
                    key={day.toString()}
                    data-column-index={dayIndex}
                    className={cn(
                      "h-full p-1 relative flex flex-col items-stretch justify-start rounded-none border-r last:border-r-0",
                      "transition-colors",
                      !isCurrentMonth && "bg-muted/30",
                      isToday(day) && "bg-accent/30",
                      isWeekend && "bg-muted/20"
                    )}
                  >
                    <span className={cn(
                      "flex items-center justify-center w-7 h-7 mb-1 mx-auto rounded-full text-sm",
                      !isCurrentMonth && "text-muted-foreground",
                      isToday(day) && "bg-primary text-primary-foreground font-bold",
                      isWeekend && !isCurrentMonth && "text-red-600/40",
                      isWeekend && isCurrentMonth && "text-red-600"
                    )}>
                      {format(day, "d")}
                    </span>

                    <div className="space-y-1 px-1">
                      {dayReservations.slice(0, 3).map((res) => {
                        const service = services.find(s => s.id === res.serviceId)
                        const staff = staffMembers.find(s => s.id === res.staffId)
                        const startTime = new Date(res.start ?? "")

                        return (
                          <div
                            key={res.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              onReservationClick(res)
                            }}
                            className="group/res relative cursor-pointer"
                            ref={el => {
                              reservationRefs.current[res.id] = el
                              if (el) {
                                updateCardPosition(res.id)
                              }
                            }}
                          >
                            <div className={cn(
                              "w-full px-2 py-1 rounded-md text-white text-xs transition-all",
                              "hover:ring-2 hover:ring-offset-1 hover:ring-primary",
                              "flex items-center gap-1.5 truncate",
                              getServiceColor(res.id, day, dayReservations)
                            )}>
                              <span className="font-medium min-w-[40px]">
                                {format(startTime, "HH:mm")}
                              </span>
                              <span className="truncate flex-1">
                                {res.customer.firstName} {res.customer.lastName}
                              </span>
                            </div>
                            
                            {/* Enhanced Hover Card */}
                            <div className={cn(
                              "absolute z-50 w-64 opacity-0 scale-95",
                              "group-hover/res:opacity-100 group-hover/res:scale-100",
                              "transition-all duration-200 pointer-events-none",
                              weekIndex < 3 ? "top-0" : "bottom-0",
                              showOnLeft[res.id] ? "right-full mr-2" : "left-full ml-2"
                            )}>
                              <Card className="p-3 shadow-lg border-primary/20">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span>{format(startTime, "HH:mm")} - {format(new Date(res.end ?? ""), "HH:mm")}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-primary" />
                                    <span>{res.customer.firstName} {res.customer.lastName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="font-medium">{service?.name}</span>
                                    <span>•</span>
                                    <span>{staff?.firstName}</span>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </div>
                        )
                      })}
                      {dayReservations.length > 3 && (
                        <div 
                          className="text-xs text-muted-foreground text-center hover:text-primary cursor-pointer px-2 py-0.5 rounded bg-accent/50 hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation()
                            const dayElement = e.currentTarget.closest('[data-column-index]')
                            if (dayElement) {
                              const rect = dayElement.getBoundingClientRect()
                              setExpandedDayRect(rect)
                              setExpandedDay(day)
                            }
                          }}
                        >
                          +{dayReservations.length - 3} {t("admin-reservation.calendar.moreEvents")}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Day Popup */}
      {expandedDay && expandedDayRect && (
        <div 
          className="fixed z-50 bg-background rounded-lg shadow-lg border p-3 min-w-[280px]"
          style={{
            top: `${expandedDayRect.top}px`,
            left: `${expandedDayRect.left}px`,
            width: `${expandedDayRect.width}px`,
            minHeight: `${expandedDayRect.height}px`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">
                {format(startOfDay(expandedDay), "d")}
              </span>
              <span className="text-sm text-muted-foreground">
                {format(startOfDay(expandedDay), "EEEE")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-accent"
              onClick={() => {
                setExpandedDay(null)
                setExpandedDayRect(null)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {getReservationsForDate(expandedDay).map((res) => {
                const service = services.find(s => s.id === res.serviceId)
                const staff = staffMembers.find(s => s.id === res.staffId)
                const startTime = new Date(res.start ?? "")

                return (
                  <div
                    key={res.id}
                    onClick={() => {
                      onReservationClick(res)
                      setExpandedDay(null)
                      setExpandedDayRect(null)
                    }}
                    className="group/res relative cursor-pointer"
                    ref={el => {
                      reservationRefs.current[res.id] = el
                      if (el) {
                        updateCardPosition(res.id)
                      }
                    }}
                  >
                    <div className={cn(
                      "w-full px-2 py-1.5 rounded-md text-white text-xs transition-all",
                      "hover:ring-2 hover:ring-offset-1 hover:ring-primary",
                      "flex items-center gap-1.5",
                      getServiceColor(res.id, new Date(res.start ?? ""), getReservationsForDate(expandedDay))
                    )}>
                      <span className="font-medium min-w-[40px]">
                        {format(startTime, "HH:mm")}
                      </span>
                      <span className="truncate flex-1">
                        {res.customer.firstName} {res.customer.lastName}
                      </span>
                    </div>
                    
                    {/* Enhanced Hover Card */}
                    <div className={cn(
                      "absolute z-50 w-64 opacity-0 scale-95",
                      "group-hover/res:opacity-100 group-hover/res:scale-100",
                      "transition-all duration-200 pointer-events-none",
                      "top-0",
                      showOnLeft[res.id] ? "right-full mr-2" : "left-full ml-2"
                    )}>
                      <Card className="p-3 shadow-lg border-primary/20">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{format(startTime, "HH:mm")} - {format(new Date(res.end ?? ""), "HH:mm")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-primary" />
                            <span>{res.customer.firstName} {res.customer.lastName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">{service?.name}</span>
                            <span>•</span>
                            <span>{staff?.firstName}</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
} 