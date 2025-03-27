import { format, parse, addMinutes, subMinutes, isSameDay } from "date-fns"
import { StaffWithServices, ReservationWithDetails, WeeklyHours } from "@/lib/types"

export function isStaffWorkingOnDay(staffMember: StaffWithServices | undefined, day: Date): boolean {
  if (!staffMember) return false
  const dayName = format(day, "EEE").toUpperCase() as keyof WeeklyHours
  return Boolean(staffMember.weeklyHours?.[dayName]?.length)
}

export function getStaffWorkingHours(staffMember: StaffWithServices | undefined, day: Date) {
  if (!staffMember?.weeklyHours) return null
  const dayName = format(day, "EEE").toUpperCase() as keyof WeeklyHours
  return staffMember.weeklyHours[dayName] || null
}

interface TimeSlot {
  time: Date
  available: boolean
  warning?: boolean
  isOccupied?: boolean
}

export function getAvailableTimesForDay(
  day: Date,
  staffMember: StaffWithServices | undefined,
  reservations: ReservationWithDetails[],
  selectedServiceDuration: number = 30,
  maxDaysInFuture: number = 30
): TimeSlot[] {
  if (!staffMember) return []

  const workingHours = getStaffWorkingHours(staffMember, day)
  if (!workingHours || workingHours.length === 0) return []

  const availableTimes: TimeSlot[] = []
  const now = new Date()
  const futureLimit = addMinutes(now, maxDaysInFuture * 24 * 60)

  workingHours.forEach(slot => {
    let currentTime = parse(slot.start || "", "HH:mm", day)
    const endTime = parse(slot.end || "", "HH:mm", day)

    while (currentTime <= subMinutes(endTime, 15)) {
      // Check if there are any reservations that overlap with this time slot
      const hasConflict = reservations
        .filter(res => res.staffId === staffMember.id) // Only check reservations for the selected staff
        .some((res) => {
          const reservationStart = new Date(res.start ?? "")
          const reservationEnd = addMinutes(reservationStart, res.service.duration ?? 30)
          const slotEnd = addMinutes(currentTime, selectedServiceDuration)

          return (
            isSameDay(reservationStart, day) &&
            // Check if the current slot overlaps with any reservation
            (currentTime >= reservationStart && currentTime < reservationEnd) ||
            (slotEnd > reservationStart && slotEnd <= reservationEnd) ||
            (currentTime <= reservationStart && slotEnd >= reservationEnd)
          )
        })

      // Check if this exact time slot is occupied by a reservation
      const isOccupied = reservations
        .filter(res => res.staffId === staffMember.id)
        .some((res) => {
          const reservationStart = new Date(res.start ?? "")
          const reservationEnd = addMinutes(reservationStart, res.service.duration ?? 30)
          return isSameDay(reservationStart, day) && 
                 currentTime >= reservationStart && 
                 currentTime < reservationEnd
        })

      const isPastDateTime = currentTime < now
      const isFutureDateTime = currentTime > futureLimit

      availableTimes.push({
        time: new Date(currentTime),
        available: !hasConflict && !isPastDateTime && !isFutureDateTime,
        warning: false, // Will be updated in the next step
        isOccupied
      })

      currentTime = addMinutes(currentTime, 15)
    }
  })

  // Mark slots as warning based on selected service duration
  availableTimes.forEach((slot, index) => {
    if (!slot.available) {
      // Calculate how many slots we need to mark as warning based on service duration
      const warningSlotsCount = Math.ceil(selectedServiceDuration / 15)
      
      // Mark previous slots as warning
      for (let i = 1; i <= warningSlotsCount; i++) {
        if (index - i >= 0 && availableTimes[index - i].available) {
          availableTimes[index - i].warning = true
        }
      }
      
      // Mark next slots as warning
      for (let i = 1; i <= warningSlotsCount; i++) {
        if (index + i < availableTimes.length && availableTimes[index + i].available) {
          availableTimes[index + i].warning = true
        }
      }
    }
  })

  return availableTimes
} 