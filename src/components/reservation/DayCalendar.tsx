"use client"

import { format, isSameDay, setHours } from "date-fns"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ReservationWithDetails, StaffWithServices, Service } from "@/lib/types"
import { Clock, User } from "lucide-react"

interface DayCalendarProps {
  currentDate: Date
  reservations: ReservationWithDetails[]
  services: Service[]
  staffMembers: StaffWithServices[]
  selectedStaff: string | null
  onReservationClick: (reservation: ReservationWithDetails) => void
}

export function DayCalendar({
  currentDate,
  reservations,
  services,
  staffMembers,
  selectedStaff,
  onReservationClick
}: DayCalendarProps) {
  // Generate hourly slots for the day
  const hourSlots = Array.from({ length: 24 }, (_, i) => {
    const time = new Date(currentDate)
    return setHours(time, i)
  })

  const getReservationsForHourSlot = (hour: Date) => {
    return reservations.filter(res => {
      const resStart = new Date(res.start ?? "")
      
      // Sadece başlangıç saatine göre filtreleme yap
      return isSameDay(resStart, currentDate) &&
        resStart.getHours() === hour.getHours() &&
        (!selectedStaff || selectedStaff === "all" || res.staffId === Number(selectedStaff))
    })
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
      "bg-amber-400 hover:bg-amber-500",
      "bg-blue-500 hover:bg-blue-600",
      "bg-green-500 hover:bg-green-600",
      "bg-purple-500 hover:bg-purple-600",
      "bg-yellow-500 hover:bg-yellow-600",
      "bg-pink-500 hover:bg-pink-600",
      "bg-indigo-500 hover:bg-indigo-600",
      "bg-red-500 hover:bg-red-600",
      "bg-orange-500 hover:bg-orange-600",
      "bg-teal-500 hover:bg-teal-600",
      "bg-cyan-500 hover:bg-cyan-600",
      "bg-lime-500 hover:bg-lime-600",
      "bg-emerald-500 hover:bg-emerald-600",
      "bg-sky-500 hover:bg-sky-600",
      "bg-violet-500 hover:bg-violet-600",
      "bg-fuchsia-500 hover:bg-fuchsia-600",
      "bg-rose-500 hover:bg-rose-600",
      "bg-amber-500 hover:bg-amber-600",
      "bg-blue-600 hover:bg-blue-700",
      "bg-green-600 hover:bg-green-700",
      "bg-purple-600 hover:bg-purple-700",
      "bg-yellow-600 hover:bg-yellow-700",
      "bg-pink-600 hover:bg-pink-700",
      "bg-indigo-600 hover:bg-indigo-700",
      "bg-red-600 hover:bg-red-700",
      "bg-orange-600 hover:bg-orange-700",
      "bg-teal-600 hover:bg-teal-700",
      "bg-cyan-600 hover:bg-cyan-700",
      "bg-lime-600 hover:bg-lime-700",
      "bg-emerald-600 hover:bg-emerald-700",
      "bg-sky-600 hover:bg-sky-700",
      "bg-violet-600 hover:bg-violet-700",
      "bg-fuchsia-600 hover:bg-fuchsia-700",
      "bg-rose-600 hover:bg-rose-700",
      "bg-amber-600 hover:bg-amber-700"
    ]
    
    // Rastgele ama sabit bir renk seçimi için reservationId'yi kullan
    const hash = reservationId.toString().split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0) | 0
    }, 0)

    // Mutlak değer al ve renk sayısına göre modunu al
    const colorIndex = Math.abs(hash) % colors.length
    
    return colors[colorIndex]
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="relative min-w-[800px]">
        {/* Time indicators */}
        <div className="absolute left-0 top-0 w-20 h-full border-r">
          {hourSlots.map((hour, i) => (
            <div
              key={i}
              className="h-16 pr-4 text-sm text-muted-foreground text-right flex items-center justify-end"
            >
              {format(hour, "HH:mm")}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="ml-20">
          {hourSlots.map((hour, i) => {
            const hourReservations = getReservationsForHourSlot(hour)
            
            return (
              <div
                key={i}
                className={cn(
                  "h-16 border-b relative group p-1.5",
                  i % 2 === 0 && "border-muted bg-muted/5"
                )}
              >
                {/* Reservations */}
                <div className="flex gap-1.5 flex-wrap h-full items-center">
                  {hourReservations.map((res) => {
                    const start = new Date(res.start ?? "")
                    const end = new Date(res.end ?? "")
                    const service = services.find(s => s.id === res.serviceId)
                    const staff = staffMembers.find(s => s.id === res.staffId)

                    return (
                      <div
                        key={res.id}
                        className={cn(
                          "px-2.5 py-1 rounded-sm cursor-pointer flex-shrink-0 transition-all duration-200 relative group/res",
                          "text-white min-w-[200px]",
                          getServiceColor(res.serviceId ?? 0, res.id)
                        )}
                        onClick={() => onReservationClick(res)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm truncate">
                            {res.customer.firstName} {res.customer.lastName}
                          </div>
                          <div className="text-xs whitespace-nowrap">
                            {format(start, "HH:mm")} - {format(end, "HH:mm")}
                          </div>
                        </div>

                        {/* Hover Card */}
                        <Card className={cn(
                          "absolute z-[9999] w-64 opacity-0 scale-95 pointer-events-none",
                          "group-hover/res:opacity-100 group-hover/res:scale-100",
                          "transition-all duration-200 shadow-xl",
                          "left-0 top-full mt-1"
                        )}>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <User className="h-4 w-4 text-primary" />
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
                              <span className="text-xs">{staff?.firstName} {staff?.lastName}</span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
} 