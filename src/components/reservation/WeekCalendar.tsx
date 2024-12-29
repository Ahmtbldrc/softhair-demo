"use client"

import { format, isSameDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Service, StaffWithServices, ReservationWithDetails } from "@/lib/database.types"

interface WeekCalendarProps {
  days: Date[]
  sortedReservations: ReservationWithDetails[]
  services: Service[]
  staffMembers: StaffWithServices[]
  handleReservationClick: (reservation: ReservationWithDetails) => void
  groupReservationsByTime: (reservations: ReservationWithDetails[]) => { [key: string]: ReservationWithDetails[] }
}

export function WeekCalendar({
  days,
  sortedReservations,
  services,
  staffMembers,
  handleReservationClick,
  groupReservationsByTime
}: WeekCalendarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {days.map((day) => (
        <Card key={day.toString()} className="p-2">
          <CardHeader className="p-2">
            <CardTitle className="text-sm">{format(day, "EEE")}</CardTitle>
            <p className="text-xs text-muted-foreground">{format(day, "MMM d")}</p>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-40 md:h-60">
              {Object.entries(groupReservationsByTime(sortedReservations.filter((res) => isSameDay(new Date(res.start), day))))
                .map(([time, reservations]) => (
                  <div key={time} className="mb-2">
                    <p className="text-xs font-semibold">{time}</p>
                    {reservations.map((res) => (
                      <div 
                        key={res.id} 
                        className="text-xs mb-1 p-1 bg-primary text-primary-foreground rounded cursor-pointer"
                        onClick={() => handleReservationClick(res)}
                      >
                        <span className="md:hidden">{services.find(s => s.id === res.serviceId)?.name} - {staffMembers.find(s => s.id === res.staffId)?.firstName}</span>
                        <span className="hidden md:inline">{services.find(s => s.id === res.serviceId)?.name} - {staffMembers.find(s => s.id === res.staffId)?.firstName}</span>
                      </div>
                    ))}
                  </div>
                ))}
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 