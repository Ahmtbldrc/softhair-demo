"use client"

import { format, isSameDay, addMinutes, setHours, setMinutes } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Service, StaffWithServices, ReservationWithDetails } from "@/lib/types"
import { Clock, User, Calendar, ChevronRight } from "lucide-react"
import { useLocale } from "@/contexts/LocaleContext"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"

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

// Çalışma saatleri (örnek olarak 09:00-18:00)
const WORK_START_HOUR = 9
const WORK_END_HOUR = 18
const TIME_SLOT_DURATION = 30 // dakika

// Tüm saat dilimlerini oluştur
const generateTimeSlots = (date: Date) => {
  const slots: Date[] = []
  let currentTime = setMinutes(setHours(date, WORK_START_HOUR), 0)
  const endTime = setMinutes(setHours(date, WORK_END_HOUR), 0)

  while (currentTime < endTime) {
    slots.push(currentTime)
    currentTime = addMinutes(currentTime, TIME_SLOT_DURATION)
  }

  return slots
}

// Renk paleti
const getServiceColor = (reservationId: number) => {
  const colors = [
    "bg-blue-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-yellow-400",
    "bg-pink-400",
    "bg-indigo-400",
    "bg-red-400",
    "bg-orange-400",
    "bg-teal-400",
    "bg-cyan-400",
    "bg-lime-400",
    "bg-emerald-400",
    "bg-sky-400",
    "bg-violet-400",
    "bg-fuchsia-400",
    "bg-rose-400",
    "bg-amber-400",
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
    "bg-amber-600"
  ]
  
  // Rastgele ama sabit bir renk seçimi için reservationId'yi kullan
  const hash = reservationId.toString().split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0
  }, 0)

  // Mutlak değer al ve renk sayısına göre modunu al
  const colorIndex = Math.abs(hash) % colors.length
  
  return colors[colorIndex]
}

export function WeekCalendar({
  days,
  sortedReservations,
  services,
  staffMembers,
  selectedStaff,
  handleReservationClick,
  isMobile = false,
}: WeekCalendarProps) {
  const { t } = useLocale();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    reservations: ReservationWithDetails[];
    time: Date;
  } | null>(null);

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
                    {reservation.customer.name} {reservation.customer.surname}
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
                <div className="flex flex-col gap-1 max-w-[70%]">
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="text-[12px] flex flex-col w-full">
                      <span className="break-words">{service?.name}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-primary/80 group-hover:text-primary transition-colors font-medium whitespace-nowrap">
                        € {service?.price}
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
                          <span className="text-[11px] text-muted-foreground/70">{service?.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground/70 group-hover:text-muted-foreground transition-colors text-right whitespace-nowrap ml-2">
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
      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-0 border rounded-lg bg-background min-w-[900px]">
          {/* Zaman çizelgesi */}
          <div className="sticky left-0 z-20 bg-background border-r">
            <div className="h-14 border-b bg-background"></div>
            <div>
              {generateTimeSlots(days[0]).map((time) => (
                <div key={time.toString()} className="h-[50px] pr-3 text-right border-b border-border/30 flex items-center justify-end">
                  <span className="text-sm text-muted-foreground">
                    {format(time, 'HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Günler */}
          {days.map((day) => {
            const dayReservations = filteredReservations.filter(res => 
              isSameDay(new Date(res.start ?? ""), day)
            )

            return (
              <div key={day.toString()} className={cn("min-w-[120px] border-r last:border-r-0", {
                "bg-accent/5": isSameDay(day, new Date())
              })}>
                {/* Gün başlığı */}
                <div className="h-14 p-3 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col justify-center">
                  <p className={cn("text-sm font-medium", {
                    "text-primary": isSameDay(day, new Date())
                  })}>{format(day, "EEE")}</p>
                  <p className={cn("text-xs", {
                    "text-primary": isSameDay(day, new Date()),
                    "text-muted-foreground": !isSameDay(day, new Date())
                  })}>{format(day, "MMM d")}</p>
                </div>

                {/* Saat dilimleri ve randevular */}
                <div className="relative">
                  {generateTimeSlots(day).map((time) => {
                    const slotReservations = dayReservations.filter(res => {
                      const resStart = new Date(res.start ?? "")
                      return format(resStart, 'HH:mm') === format(time, 'HH:mm')
                    })

                    return (
                      <div 
                        key={time.toString()} 
                        className="h-[50px] border-b border-border/30 relative group"
                      >
                        {slotReservations.length > 0 && (
                          <div className="absolute inset-0 p-1">
                            {slotReservations.length === 1 ? (
                              <AppointmentCard
                                reservation={slotReservations[0]}
                                service={services.find(s => s.id === slotReservations[0].serviceId)}
                                staff={staffMembers.find(s => s.id === slotReservations[0].staffId)}
                                onClick={() => handleReservationClick(slotReservations[0])}
                              />
                            ) : (
                              <button
                                onClick={() => setSelectedTimeSlot({ reservations: slotReservations, time })}
                                className={cn(
                                  "w-full h-full rounded-sm p-2 cursor-pointer transition-all",
                                  "hover:ring-2 hover:ring-primary/20 group/slot",
                                  getServiceColor(slotReservations[0].id)
                                )}
                              >
                                <div className="h-full flex items-center justify-between text-white">
                                  <div className="text-[12px] font-medium truncate flex items-center gap-1.5">
                                    <span>{format(time, "HH:mm")}</span>
                                    <span className="text-white/80">•</span>
                                    <span className="truncate">{slotReservations[0].customer.name} {slotReservations[0].customer.surname}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] bg-white/20 px-1.5 py-0.5 rounded">
                                      +{slotReservations.length - 1}
                                    </span>
                                    <ChevronRight className="h-3 w-3 text-white/70 group-hover/slot:text-white transition-colors" />
                                  </div>
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <Dialog open={selectedTimeSlot !== null} onOpenChange={() => setSelectedTimeSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTimeSlot && format(selectedTimeSlot.time, "HH:mm")} - {t("staff-reservation.appointments")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {selectedTimeSlot?.reservations.map((reservation) => {
              const service = services.find(s => s.id === reservation.serviceId)
              const staff = staffMembers.find(s => s.id === reservation.staffId)
              
              return (
                <div
                  key={reservation.id}
                  onClick={() => {
                    handleReservationClick(reservation)
                    setSelectedTimeSlot(null)
                  }}
                  className="bg-card rounded-lg p-3 cursor-pointer hover:bg-accent/5 transition-all duration-200 border border-border/50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-[13px] flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary/70" />
                        {reservation.customer.name} {reservation.customer.surname}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {reservation.customer.phone}
                      </div>
                    </div>
                    <div className="text-[13px] font-medium text-primary">
                      {format(new Date(reservation.start ?? ""), 'HH:mm')} - {format(new Date(reservation.end ?? ""), 'HH:mm')}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex justify-between items-end">
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <div className="text-[12px] flex flex-col">
                        <span className="break-words">{service?.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-primary/80 font-medium whitespace-nowrap">
                          € {service?.price}
                          </span>
                          <span className="text-muted-foreground/50">•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
                            <span className="text-[11px] text-muted-foreground/70">{service?.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground/70 text-right whitespace-nowrap ml-2">
                      {staff?.firstName} {staff?.lastName}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AppointmentCard({ 
  reservation, 
  service, 
  staff, 
  onClick 
}: { 
  reservation: ReservationWithDetails
  service?: Service
  staff?: StaffWithServices
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full h-full rounded-sm p-2 cursor-pointer transition-all",
        "hover:ring-2 hover:ring-primary/20",
        "group/res",
        getServiceColor(reservation.id)
      )}
    >
      <div className="h-full flex flex-col justify-start text-white">
        <div className="text-[12px] font-medium truncate flex items-center gap-1.5">
          <span>{format(new Date(reservation.start ?? ""), "HH:mm")}</span>
          <span className="text-white/80">•</span>
          <span className="truncate">{reservation.customer.name} {reservation.customer.surname}</span>
        </div>
      </div>

      <Card className={cn(
        "absolute z-[9999] w-64 opacity-0 scale-95 pointer-events-none",
        "group-hover/res:opacity-100 group-hover/res:scale-100",
        "transition-all duration-200 shadow-xl",
        "left-full ml-2"
      )}
      style={{
        top: "50%",
        transform: "translateY(-50%)"
      }}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {format(new Date(reservation.start ?? ""), "HH:mm")} - {format(new Date(reservation.end ?? ""), "HH:mm")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-primary" />
            <span>{reservation.customer.name} {reservation.customer.surname}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{service?.name}</span>
            <span>•</span>
            <span>{staff?.firstName}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 