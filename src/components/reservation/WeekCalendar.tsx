"use client"

import { format, isSameDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Service, StaffWithServices, ReservationWithDetails } from "@/lib/types"
import { Clock, User, Calendar } from "lucide-react"
import { useLocale } from "@/contexts/LocaleContext"

interface WeekCalendarProps {
  days: Date[]
  sortedReservations: ReservationWithDetails[]
  services: Service[]
  staffMembers: StaffWithServices[]
  selectedStaff: string | null
  handleReservationClick: (reservation: ReservationWithDetails) => void
  groupReservationsByTime: (reservations: ReservationWithDetails[]) => { [key: string]: ReservationWithDetails[] }
  isMobile?: boolean
}

export function WeekCalendar({
  days,
  sortedReservations,
  services,
  staffMembers,
  selectedStaff,
  handleReservationClick,
  groupReservationsByTime,
  isMobile = false,
}: WeekCalendarProps) {
  const { t } = useLocale();

  // Rezervasyonları seçili staff'a göre filtrele
  const filteredReservations = sortedReservations.filter(reservation => 
    !selectedStaff || selectedStaff === "all" || reservation.staffId === Number(selectedStaff)
  )

  if (isMobile) {
    const filteredReservations = sortedReservations.filter(res => 
      (!selectedStaff || selectedStaff === "all" || res.staffId === Number(selectedStaff)) &&
      isSameDay(new Date(res.start ?? ""), days[0])
    );

    if (filteredReservations.length === 0) {
      return (
        <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-muted-foreground">
          <Calendar className="h-12 w-12 mb-3" />
          <p className="text-base">{t("staff-reservation.noAppointments")}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredReservations.map((reservation) => {
          const service = services.find(s => s.id === reservation.serviceId)
          const staff = staffMembers.find(s => s.id === reservation.staffId)
          
          return (
            <div
              key={reservation.id}
              onClick={() => handleReservationClick(reservation)}
              className="bg-card rounded-lg p-3 cursor-pointer hover:bg-accent/5 transition-all duration-200 border border-border/50 shadow-sm hover:shadow-md group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-[13px] flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary transition-colors" />
                    {reservation.customer.firstName} {reservation.customer.lastName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {reservation.customer.phone}
                  </div>
                </div>
                <div className="text-[13px] font-medium text-primary/80 group-hover:text-primary transition-colors">
                  {format(new Date(reservation.start ?? ""), 'HH:mm')}
                </div>
              </div>
              
              <div className="mt-2 flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 w-full">
                    <div className="text-[12px] flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{service?.name}</span>
                      <span className="text-muted-foreground/50 whitespace-nowrap">•</span>
                      <span className="text-primary/80 group-hover:text-primary transition-colors font-medium whitespace-nowrap">CHF {service?.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
                    <span>30</span>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground/70 group-hover:text-muted-foreground transition-colors text-right whitespace-nowrap">
                  {staff?.firstName} {staff?.lastName}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => (
          <Card key={day.toString()} className="p-2">
            <CardHeader className="p-2">
              <CardTitle className="text-sm">{format(day, "EEE")}</CardTitle>
              <p className="text-xs text-muted-foreground">{format(day, "MMM d")}</p>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-40 md:h-60">
                {Object.entries(groupReservationsByTime(
                  filteredReservations.filter(res => isSameDay(new Date(res.start ?? ""), day))
                )).map(([time, reservations]) => (
                  <div key={time} className="mb-2">
                    <p className="text-xs font-semibold">{time}</p>
                    {reservations.map((res: ReservationWithDetails) => (
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
    </div>
  )
} 