import { format, parse, addMinutes, subMinutes, isSameDay } from "date-fns"
import { StaffWithServices, ReservationWithDetails, WeeklyHours } from "@/lib/database.types"

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
}

export function getAvailableTimesForDay(
  day: Date,
  staffMember: StaffWithServices | undefined,
  reservations: ReservationWithDetails[],
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

    while (currentTime <= subMinutes(endTime, 30)) {
      const hasConflict = reservations.some((res) =>
        res.staffId === staffMember.id &&
        isSameDay(new Date(res.start), day) &&
        format(currentTime, "HH:mm") === format(new Date(res.start), "HH:mm")
      )

      const isPastDateTime = currentTime < now
      const isFutureDateTime = currentTime > futureLimit

      availableTimes.push({
        time: new Date(currentTime),
        available: !hasConflict && !isPastDateTime && !isFutureDateTime
      })

      currentTime = addMinutes(currentTime, 30)
    }
  })

  return availableTimes
} 