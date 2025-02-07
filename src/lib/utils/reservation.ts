import { format, compareAsc } from "date-fns"
import { ReservationWithDetails } from "@/lib/database.types"

export const filterReservationsByStaff = (
  reservations: ReservationWithDetails[], 
  staffId: number | null
): ReservationWithDetails[] => {
  if (!staffId) return reservations
  return reservations.filter(r => r.staffId === staffId)
}

export function sortReservationsByDate(reservations: ReservationWithDetails[]): ReservationWithDetails[] {
  return reservations.sort((a, b) => compareAsc(new Date(a.start), new Date(b.start)))
}

export function groupReservationsByTime(reservations: ReservationWithDetails[]): { [key: string]: ReservationWithDetails[] } {
  const grouped: { [key: string]: ReservationWithDetails[] } = {}
  reservations.forEach(res => {
    const timeKey = format(new Date(res.start), "HH:mm")
    if (!grouped[timeKey]) {
      grouped[timeKey] = []
    }
    grouped[timeKey].push(res)
  })
  return grouped
}

export function validateReservationCancellation(
  reservation: ReservationWithDetails | undefined,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  if (!reservation) {
    return {
      isValid: false,
      error: {
        title: t("admin-reservation.cancelError"),
        description: t("admin-reservation.reservationNotFound")
      }
    }
  }

  if (new Date(reservation.start) < new Date()) {
    return {
      isValid: false,
      error: {
        title: t("admin-reservation.cancelError"),
        description: t("admin-reservation.cannotCancelPast")
      }
    }
  }

  return { isValid: true }
} 