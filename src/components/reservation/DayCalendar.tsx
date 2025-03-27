"use client"

import { format, isSameDay, setHours, addMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ReservationWithDetails, StaffWithServices, Service } from "@/lib/types"
import { Clock, User } from "lucide-react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import React, { useEffect, useState } from "react"
import { useLocale } from "@/contexts/LocaleContext"

interface DayCalendarProps {
  currentDate: Date
  reservations: ReservationWithDetails[]
  services: Service[]
  staffMembers: StaffWithServices[]
  selectedStaff: string | null
  onReservationClick: (reservation: ReservationWithDetails) => void
  onTimeSlotClick: (staffId: number, startTime: Date, endTime: Date) => void
}

export function DayCalendar({
  currentDate,
  reservations,
  services,
  staffMembers,
  selectedStaff,
  onReservationClick,
  onTimeSlotClick
}: DayCalendarProps) {
  const { t } = useLocale()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = currentDate.getDay()
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const currentDay = dayNames[dayOfWeek]

  // Filter staff members based on selection and working hours
  const filteredStaffMembers = staffMembers.filter(staff => {
    // Check if staff is selected
    if (selectedStaff && selectedStaff !== "all" && staff.id !== Number(selectedStaff)) {
      return false
    }

    // Check if staff has working hours for the current day
    const dayHours = staff.weeklyHours?.[currentDay]
    if (!dayHours || dayHours.length === 0) {
      return false
    }

    return true
  })

  // Find earliest start and latest end times
  const workingHours = filteredStaffMembers.flatMap(staff => 
    staff.weeklyHours?.[currentDay] || []
  )

  const earliestStart: number = workingHours.reduce((earliest, slot) => {
    const [hour] = slot.start.split(':').map(Number)
    return hour < earliest ? hour : earliest
  }, 24)

  const latestEnd: number = workingHours.reduce((latest, slot) => {
    const [hour, minute = "0"] = slot.end.split(':').map(Number)
    // Convert time to decimal hours for comparison
    const timeInHours: number = Number(hour) + (Number(minute) / 60)
    return timeInHours > latest ? timeInHours : latest
  }, 0)

  // Generate 15-minute slots for the working hours
  const timeSlots = Array.from(
    { length: Math.ceil((latestEnd - earliestStart) * 4) }, 
    (_, i) => {
      const time = new Date(currentDate)
      const hour = earliestStart + Math.floor(i / 4)
      const minutes = (i % 4) * 15
      time.setHours(hour, minutes, 0, 0)
      return time
    }
  )

  const getReservationsForStaffAndTime = (staffId: number, time: Date) => {
    return reservations.filter(res => {
      const resStart = new Date(res.start ?? "")
      const resEnd = new Date(res.end ?? "")
      return isSameDay(resStart, currentDate) &&
        res.staffId === staffId &&
        time >= resStart &&
        time < resEnd
    })
  }

  const calculateReservationPosition = (start: Date, end: Date, earliestStart: number) => {
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    const startFromMinutes = earliestStart * 60
    
    const topPosition = ((startMinutes - startFromMinutes) / 15) * 32 // 32px per 15 minutes
    const height = ((endMinutes - startMinutes) / 15) * 32 // 32px per 15 minutes
    
    return { top: topPosition, height }
  }

  const getServiceColor = (serviceId: number, reservationId: number) => {
    const colors = [
      "bg-blue-400 hover:bg-blue-500",
      "bg-green-400 hover:bg-green-500",
      "bg-purple-400 hover:bg-purple-500",
      "bg-yellow-400 hover:bg-yellow-500",
      "bg-pink-400 hover:bg-pink-500",
      "bg-indigo-400 hover:bg-indigo-500",
      "bg-red-400 hover:bg-red-500",
      "bg-orange-400 hover:bg-orange-500",
      "bg-teal-400 hover:bg-teal-500",
      "bg-cyan-400 hover:bg-cyan-500",
      "bg-lime-400 hover:bg-lime-500",
      "bg-emerald-400 hover:bg-emerald-500",
      "bg-sky-400 hover:bg-sky-500",
      "bg-violet-400 hover:bg-violet-500",
      "bg-fuchsia-400 hover:bg-fuchsia-500",
      "bg-rose-400 hover:bg-rose-500",
      "bg-amber-400 hover:bg-amber-500"
    ]
    
    const hash = reservationId.toString().split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0) | 0
    }, 0)

    const colorIndex = Math.abs(hash) % colors.length
    return colors[colorIndex]
  }

  // Check if a staff member is working at a specific hour
  const isStaffWorkingAtHour = (staff: StaffWithServices, hour: Date) => {
    const dayHours = staff.weeklyHours?.[currentDay]
    if (!dayHours) return false

    const currentHour = hour.getHours()
    const currentMinutes = hour.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinutes

    return dayHours.some((timeSlot: { start: string; end: string }) => {
      const [startHour, startMinute = "0"] = timeSlot.start.split(':').map(Number)
      const [endHour, endMinute = "0"] = timeSlot.end.split(':').map(Number)
      const startTimeInMinutes = startHour * 60 + Number(startMinute)
      const endTimeInMinutes = endHour * 60 + Number(endMinute)

      return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes
    })
  }

  // Check if a time slot is a break time and get break duration
  const getBreakInfo = (staff: StaffWithServices, hour: Date) => {
    const dayHours = staff.weeklyHours?.[currentDay]
    if (!dayHours || dayHours.length <= 1) return null

    // Sort time slots by start time
    const sortedHours = [...dayHours].sort((a, b) => {
      const [aHour, aMinute = "0"] = a.start.split(':').map(Number)
      const [bHour, bMinute = "0"] = b.start.split(':').map(Number)
      return (aHour * 60 + Number(aMinute)) - (bHour * 60 + Number(bMinute))
    })

    const currentHour = hour.getHours()
    const currentMinutes = hour.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinutes

    // Check if current time falls between any two consecutive working periods
    for (let i = 0; i < sortedHours.length - 1; i++) {
      const [currentEndHour, currentEndMinute = "0"] = sortedHours[i].end.split(':').map(Number)
      const [nextStartHour, nextStartMinute = "0"] = sortedHours[i + 1].start.split(':').map(Number)
      
      const currentEndTime = currentEndHour * 60 + Number(currentEndMinute)
      const nextStartTime = nextStartHour * 60 + Number(nextStartMinute)

      if (currentTimeInMinutes >= currentEndTime && currentTimeInMinutes < nextStartTime) {
        return {
          isBreak: true,
          start: `${currentEndHour.toString().padStart(2, '0')}:${currentEndMinute.toString().padStart(2, '0')}`,
          end: `${nextStartHour.toString().padStart(2, '0')}:${nextStartMinute.toString().padStart(2, '0')}`
        }
      }
    }

    return null
  }

  const isBreakTime = (staff: StaffWithServices, time: Date) => {
    const breakInfo = getBreakInfo(staff, time)
    return Boolean(breakInfo)
  }

  // Check if a time slot is available for booking
  const isSlotAvailable = (staff: StaffWithServices, time: Date) => {
    // Check if the date is in the past
    const now = new Date()
    const isToday = isSameDay(time, now)
    const isPastDate = time < now

    // If it's today, check if the time is in the past
    if (isToday) {
      const currentHour = now.getHours()
      const currentMinutes = now.getMinutes()
      const slotHour = time.getHours()
      const slotMinutes = time.getMinutes()

      // If the slot is in the past, it's not available
      if (slotHour < currentHour || (slotHour === currentHour && slotMinutes < currentMinutes)) {
        return false
      }
    }

    // If it's a past date, it's not available
    if (isPastDate) {
      return false
    }

    // Staff must be working at this hour
    if (!isStaffWorkingAtHour(staff, time)) return false
    
    // Must not be a break time
    if (getBreakInfo(staff, time)) return false
    
    // Staff must be active
    if (!staff.status) return false
    
    // Check for existing reservations
    const existingReservations = reservations.filter(res => {
      const resStart = new Date(res.start ?? "")
      const resEnd = new Date(res.end ?? "")
      return res.staffId === staff.id &&
        isSameDay(resStart, currentDate) &&
        time >= resStart &&
        time < resEnd
    })
    
    return existingReservations.length === 0
  }

  // Calculate current time position
  const calculateCurrentTimePosition = () => {
    if (!isSameDay(currentTime, currentDate)) return null

    const currentHour = currentTime.getHours()
    const currentMinutes = currentTime.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinutes
    const startTimeInMinutes = earliestStart * 60

    // If current time is before the earliest start time or after the latest end time
    if (currentTimeInMinutes < startTimeInMinutes || currentTimeInMinutes > latestEnd * 60) {
      return null
    }

    // Calculate position in pixels (32px per 15 minutes)
    // Add 64px offset for the header row (h-16 = 64px)
    const minutesFromStart = currentTimeInMinutes - startTimeInMinutes
    const position = (minutesFromStart / 15) * 32 + 64

    return position
  }

  const currentTimePosition = calculateCurrentTimePosition()

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="relative min-w-[800px] bg-background rounded-lg shadow-sm border dark:border-border">
        {/* Current time indicator */}
        {currentTimePosition !== null && (
          <div 
            className="absolute left-4 right-0 h-[1px] bg-red-500 z-50"
            style={{ top: `${currentTimePosition}px` }}
          >
            <div className="absolute -left-3 -top-1.5 w-3 h-3 rounded-full bg-red-500 group">
              <div className="absolute -top-10 left-4 translate-x-0 px-2 py-1 bg-background border rounded-md shadow-sm text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100]">
                {format(currentTime, "HH:mm")}
                <div className="absolute -bottom-1 left-0 w-2 h-2 bg-background border-b border-r rotate-45"></div>
              </div>
            </div>
          </div>
        )}

        {/* Staff columns */}
        <div className="grid" style={{ gridTemplateColumns: `auto repeat(${filteredStaffMembers.length}, 1fr)` }}>
          {/* Empty cell for time column */}
          <div className="w-20 h-16 border-b border-border bg-background/95 dark:bg-background/95 backdrop-blur-sm sticky top-0 z-20" />

          {/* Staff headers */}
          {filteredStaffMembers.map((staff) => {
            const dayHours = staff.weeklyHours?.[currentDay]
            const workingHours = dayHours?.map(slot => `${slot.start}-${slot.end}`).join(", ") || "Çalışmıyor"

            return (
              <div
                key={staff.id}
                className={cn(
                  "h-16 border-b border-l border-border p-2 flex items-center gap-3 bg-background/95 dark:bg-background/95 backdrop-blur-sm hover:bg-accent/50 dark:hover:bg-accent/25 transition-colors sticky top-0 z-20",
                  !staff.status && "opacity-50 bg-muted/20 dark:bg-muted/30"
                )}
                style={{ pointerEvents: "auto" }}
              >
                 <div className="h-10 w-10 relative overflow-hidden rounded-md flex-shrink-0">
                    <Image
                      src={staff.image ? `https://rlffvcspggzfedokaqsr.supabase.co/storage/v1/object/public/staff/${staff.image}` : "https://www.gravatar.com/avatar/000?d=mp&f=y"}
                      alt={`${staff.firstName} ${staff.lastName}`}
                      fill
                      className={cn(
                        "object-cover",
                        !staff.status && "grayscale"
                      )}
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.src = "https://www.gravatar.com/avatar/000?d=mp&f=y";
                      }}
                    />
                  </div>
                <div className="min-w-0">
                  <div className={cn(
                    "font-medium text-sm truncate",
                    !staff.status ? "text-foreground" : "text-foreground"
                  )}>
                    {staff.firstName} {staff.lastName}
                    {!staff.status && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({t("common.inactive")})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {workingHours}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Time slots grid */}
          {timeSlots.map((time, timeIndex) => (
            <React.Fragment key={timeIndex}>
              {/* Time indicator */}
              <div
                className={cn(
                  "w-20 border-b border-border pr-4 text-sm text-right flex items-center justify-end group",
                  timeIndex % 4 === 0 ? "text-muted-foreground" : "text-transparent group-hover:text-muted-foreground",
                  "transition-colors duration-200"
                )}
                style={{ 
                  height: "2rem",
                  pointerEvents: "auto"
                }}
              >
                {format(time, timeIndex % 4 === 0 ? "HH:mm" : "mm")}
              </div>

              {/* Appointment slots */}
              {filteredStaffMembers.map((staff) => {
                const staffReservations = reservations.filter(res => 
                  res.staffId === staff.id && 
                  isSameDay(new Date(res.start ?? ""), currentDate)
                )
                const isWorking = isStaffWorkingAtHour(staff, time)
                const breakInfo = getBreakInfo(staff, time)
                const isBreak = Boolean(breakInfo)
                const isAvailable = isSlotAvailable(staff, time)

                // Calculate if this is the middle slot of the break period
                const showBreakText = breakInfo && (() => {
                  const [startHour, startMinute = "0"] = breakInfo.start.split(':').map(Number)
                  const [endHour, endMinute = "0"] = breakInfo.end.split(':').map(Number)
                  const startMinutes = startHour * 60 + Number(startMinute)
                  const endMinutes = endHour * 60 + Number(endMinute)
                  const currentMinutes = time.getHours() * 60 + time.getMinutes()
                  const middleMinutes = startMinutes + Math.floor((endMinutes - startMinutes) / 2)
                  return currentMinutes === Math.floor(middleMinutes / 15) * 15
                })()
                
                return (
                  <div
                    key={`${staff.id}-${timeIndex}`}
                    className={cn(
                      "relative group",
                      "transition-colors duration-200",
                      timeIndex % 8 === 0 
                        ? "bg-background dark:bg-muted/5" 
                        : "bg-muted/5 dark:bg-muted/10",
                      !staff.status && "bg-muted/20 dark:bg-muted/30 opacity-50",
                      !isWorking && !isBreak && "bg-muted/10 dark:bg-muted/20",
                      isBreak && "bg-orange-100 dark:bg-orange-900/20",
                      isAvailable && staff.status && "hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer",
                      // Add border-b only if next slot is not a break
                      (!isBreak || timeIndex === timeSlots.length - 1) && "border-b",
                      // Add border-l always
                      "border-l",
                      "border-border",
                      "h-8"
                    )}
                    style={{
                      pointerEvents: isAvailable && staff.status ? "auto" : "none"
                    }}
                    onClick={() => {
                      if (isAvailable && staff.status) {
                        const endTime = new Date(time)
                        endTime.setMinutes(endTime.getMinutes() + 15)
                        onTimeSlotClick(staff.id, time, endTime)
                      }
                    }}
                  >
                    {/* Hover effect for available slots */}
                    {isAvailable && staff.status && (
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100",
                        "transition-opacity duration-200 pointer-events-none",
                        "flex items-center justify-center"
                      )}>
                        <div className="bg-primary/5 dark:bg-primary/10 rounded-md px-2 py-1">
                          <span className="text-xs font-medium text-primary">
                            {t("common.clickToBook")}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Floating time indicator */}
                    <div className={cn(
                      "absolute left-0 -ml-20 w-20 pr-4 text-sm text-muted-foreground text-right",
                      "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                      "pointer-events-none z-50 bg-background/80 backdrop-blur-sm",
                      "h-8 flex items-center justify-end"
                    )}>
                      {format(time, "HH:mm")}
                    </div>

                    {/* Break time text */}
                    {showBreakText && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                          {t("common.breakTimeRange", { start: breakInfo.start, end: breakInfo.end })}
                        </span>
                      </div>
                    )}

                    {timeIndex === 0 && staffReservations.map((res) => {
                      const start = new Date(res.start ?? "")
                      const end = new Date(res.end ?? "")
                      const service = services.find(s => s.id === res.serviceId)
                      const { top, height } = calculateReservationPosition(start, end, earliestStart)
                      const duration = end.getTime() - start.getTime()
                      const isSingleLine = duration <= 15 * 60 * 1000 // 15 minutes in milliseconds

                      return (
                        <div
                          key={res.id}
                          className={cn(
                            "absolute left-1.5 right-1.5 px-2.5 py-1.5 rounded-md cursor-pointer",
                            "transition-all duration-200 group/res",
                            "text-white shadow-sm hover:shadow-md",
                            getServiceColor(res.serviceId ?? 0, res.id)
                          )}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            zIndex: 1,
                            pointerEvents: "auto",
                            display: isSingleLine ? "flex" : "block",
                            alignItems: isSingleLine ? "center" : "flex-start"
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onReservationClick(res)
                          }}
                        >
                          <div className={cn(
                            "flex gap-2 min-w-0",
                            isSingleLine ? "items-center w-full" : "flex-col h-full"
                          )}>
                            <div className={cn(
                              "flex items-center min-w-0",
                              isSingleLine ? "w-full justify-between" : ""
                            )}>
                              {isSingleLine ? (
                                <>
                                  <div className="flex items-center min-w-0">
                                    <Avatar className="h-6 w-6 rounded-md flex-shrink-0 mr-2">
                                      <AvatarImage 
                                        src={res.customer.image || ""} 
                                        alt={`${res.customer.firstName} ${res.customer.lastName}`} 
                                      />
                                      <AvatarFallback className="text-xs bg-primary/10 text-primary dark:bg-primary/20">
                                        {res.customer.firstName?.[0]}{res.customer.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="font-medium text-sm truncate">
                                      {res.customer.firstName} {res.customer.lastName}
                                    </div>
                                  </div>
                                  <div className="text-xs text-white/90 whitespace-nowrap">
                                    {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Avatar className="h-6 w-6 rounded-md flex-shrink-0">
                                    <AvatarImage 
                                      src={res.customer.image || ""} 
                                      alt={`${res.customer.firstName} ${res.customer.lastName}`} 
                                    />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary dark:bg-primary/20">
                                      {res.customer.firstName?.[0]}{res.customer.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="font-medium text-sm truncate flex-1 min-w-0 ml-2">
                                    {res.customer.firstName} {res.customer.lastName}
                                  </div>
                                  <div className="text-xs text-white/90 whitespace-nowrap flex-shrink-0">
                                    {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Hover Card */}
                          <Card className={cn(
                            "absolute z-[9999] w-64 opacity-0 scale-95 pointer-events-none",
                            "group-hover/res:opacity-100 group-hover/res:scale-100",
                            "transition-all duration-200 shadow-xl dark:border-border",
                            "left-full top-0 ml-2 bg-background"
                          )}
                          style={{
                            zIndex: 9999
                          }}>
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Avatar className="h-6 w-6 rounded-md">
                                  <AvatarImage 
                                    src={res.customer.image || ""} 
                                    alt={`${res.customer.firstName} ${res.customer.lastName}`} 
                                  />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary dark:bg-primary/20">
                                    {res.customer.firstName?.[0]}{res.customer.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{res.customer.firstName} {res.customer.lastName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-primary" />
                                <span>
                                  {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                <span className="font-medium">{service?.name}</span>
                                <span className="text-xs">{staff.firstName} {staff.lastName}</span>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
} 