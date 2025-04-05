"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLocale } from "@/contexts/LocaleContext"
import { useBranch } from "@/contexts/BranchContext"
import { useReservationCalendar } from "@/hooks/use-reservation-calendar"
import {
  NewReservationForm,
  WeekNavigation,
  StaffSelector,
  WeekCalendar,
  MonthCalendar,
  DayCalendar,
  MiniCalendar,
  ReservationDetailsDialog,
  ConfirmationDialog,
  SuccessDialog,
  ViewSwitcher,
  QuickReservationDialog
} from "@/components/reservation"
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from "lucide-react"
import { isSameMonth } from "date-fns"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StaffWithServices } from "@/lib/types"

const DailyNavigation = ({ 
  selectedDate, 
  setSelectedDate,
  staffMembers,
  currentDay
}: { 
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  staffMembers: StaffWithServices[]
  currentDay: string
}) => {
  const { t } = useLocale()

  // Get localized day name
  const getLocalizedDayName = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'MON': t('admin-reservation.calendar.days.monday'),
      'TUE': t('admin-reservation.calendar.days.tuesday'),
      'WED': t('admin-reservation.calendar.days.wednesday'),
      'THU': t('admin-reservation.calendar.days.thursday'),
      'FRI': t('admin-reservation.calendar.days.friday'),
      'SAT': t('admin-reservation.calendar.days.saturday'),
      'SUN': t('admin-reservation.calendar.days.sunday')
    }
    return dayMap[day] || day
  }

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  // Check if any staff member is working on this day
  const hasWorkingStaff = staffMembers.some(staff => {
    const dayHours = staff.weeklyHours?.[currentDay]
    return dayHours && dayHours.length > 0 && staff.status
  })

  // Check if selected date is today
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <div className="flex items-center justify-center mb-4 relative">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <div className="text-lg font-semibold">
            {selectedDate.toLocaleDateString()} - {getLocalizedDayName(currentDay)}
          </div>
          {!hasWorkingStaff && (
            <div className="text-sm text-muted-foreground">
              {t('admin-reservation.calendar.noAvailableSlots')}
            </div>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={handleNextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {!isToday && (
        <Button 
          variant="default" 
          size="sm"
          onClick={handleToday}
          className="text-sm absolute right-0 top-0 bg-primary hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('admin-reservation.calendar.today')}
        </Button>
      )}
    </div>
  )
}

export default function AppointmentCalendar() {
  const { t } = useLocale()
  const { selectedBranchId, branches } = useBranch()
  const tWithParams = t as (key: string, params?: Record<string, string | number>) => string
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("day")

  const {
    weekStart,
    weekEnd,
    days,
    reservations,
    staffMembers,
    services,
    selectedStaff,
    selectedReservation,
    isDetailsDialogOpen,
    isNewReservationDialogOpen,
    isConfirmDialogOpen,
    isSuccessDialogOpen,
    isSubmitting,
    form,
    setSelectedStaff,
    setIsDetailsDialogOpen,
    setIsNewReservationDialogOpen,
    setIsConfirmDialogOpen,
    setIsSuccessDialogOpen,
    handlePrevWeek,
    handleNextWeek,
    handleReservationClick,
    handleCancelReservation,
    handleNewReservation,
    groupReservationsByTime,
    selectedDate,
    setSelectedDate,
    isMobile,
    currentDay,
    fetchDailyReservations,
    setViewType
  } = useReservationCalendar(selectedBranchId, tWithParams)

  // Sync calendarView with viewType
  useEffect(() => {
    setViewType(calendarView)
  }, [calendarView, setViewType])

  const [isQuickBookDialogOpen, setIsQuickBookDialogOpen] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ staffId: number; startTime: Date; endTime: Date } | null>(null)

  // Add auto-refresh for new reservation form
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isNewReservationDialogOpen) {
      // Initial fetch
      fetchDailyReservations(selectedDate)

      // Set up 5-second interval
      intervalId = setInterval(() => {
        fetchDailyReservations(selectedDate)
      }, 5000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isNewReservationDialogOpen, selectedDate, fetchDailyReservations])

  // Get the current branch information
  const currentBranch = branches.find(branch => branch.id === selectedBranchId)

  if (!currentBranch) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center">
        <p className="text-lg text-muted-foreground">{t("admin-reservation.selectBranch")}</p>
      </div>
    )
  }

  const handleTimeSlotClick = (staffId: number, startTime: Date, endTime: Date) => {
    setSelectedTimeSlot({ staffId, startTime, endTime })
    form.setValue("staffId", staffId)
    form.setValue("start", startTime)
    setIsQuickBookDialogOpen(true)
  }

  const renderCalendarView = () => {
    switch (calendarView) {
      case "month":
        return (
          <MonthCalendar
            currentDate={selectedDate}
            reservations={reservations.filter(res => {
              const resDate = new Date(res.start ?? "")
              return isSameMonth(resDate, selectedDate)
            })}
            services={services}
            staffMembers={staffMembers}
            selectedStaff={selectedStaff}
            onDateSelect={setSelectedDate}
            onReservationClick={handleReservationClick}
            t={tWithParams}
          />
        )
      case "day":
        return (
          <>
            <DailyNavigation 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              staffMembers={staffMembers}
              currentDay={currentDay}
            />
            <DayCalendar
              currentDate={selectedDate}
              reservations={reservations}
              services={services}
              staffMembers={staffMembers}
              selectedStaff={selectedStaff}
              onReservationClick={handleReservationClick}
              onTimeSlotClick={handleTimeSlotClick}
            />
            <QuickReservationDialog
              isOpen={isQuickBookDialogOpen}
              onOpenChange={setIsQuickBookDialogOpen}
              form={form}
              services={services}
              selectedStaff={staffMembers.find(staff => staff.id === selectedTimeSlot?.staffId)}
              selectedDate={selectedDate}
              selectedTime={selectedTimeSlot?.startTime ?? new Date()}
              onSubmit={handleNewReservation}
              isSubmitting={isSubmitting}
              t={tWithParams}
              reservations={reservations}
            />
          </>
        )
      case "week":
        return (
          <>
            <WeekNavigation 
              weekStart={weekStart}
              weekEnd={weekEnd}
              handlePrevWeek={handlePrevWeek}
              handleNextWeek={handleNextWeek}
            />
            <WeekCalendar
              days={days}
              sortedReservations={reservations}
              services={services}
              staffMembers={staffMembers}
              selectedStaff={selectedStaff}
              handleReservationClick={handleReservationClick}
              groupReservationsByTime={groupReservationsByTime}
              isMobile={isMobile}
            />
          </>
        )
    }
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <div className="flex flex-1">
          {/* Mini Calendar Sidebar */}
          {!isMobile && (
            <aside className="hidden lg:flex w-72 xl:w-80 border-r bg-card flex-col h-screen sticky top-0">
              <div className="p-4 xl:p-8 flex flex-col gap-4 xl:gap-8 overflow-hidden h-full">
                <div>
                  <h1 className="text-xl xl:text-2xl font-semibold tracking-tight mb-2">{tWithParams("admin-reservation.reservationCalendar")}</h1>
                  <p className="text-sm text-muted-foreground">{currentBranch.name}</p>
                </div>
                <ViewSwitcher 
                  view={calendarView}
                  onChange={(view) => {
                    setCalendarView(view)
                  }}
                  t={tWithParams}
                />
                <MiniCalendar
                  view={calendarView}
                  currentDate={selectedDate}
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                    }
                  }}
                  className="w-full"
                  disabled={[{ before: new Date() }]}
                  t={tWithParams}
                />
                <StaffSelector 
                  staffMembers={staffMembers}
                  selectedStaff={selectedStaff}
                  setSelectedStaff={setSelectedStaff}
                  t={tWithParams}
                  isMobile={isMobile}
                  className="w-full"
                />
                <Dialog 
                  open={isNewReservationDialogOpen} 
                  onOpenChange={(open) => {
                    setIsNewReservationDialogOpen(open)
                    if (!open) {
                      form.reset()
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full">{tWithParams("admin-reservation.newReservation")}</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[1200px] h-[90vh] flex flex-col overflow-hidden p-0 mx-4">
                    <DialogHeader className="px-6 py-4 border-b">
                      <DialogTitle>
                        {tWithParams("admin-reservation.newReservation")} - {currentBranch.name}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <ScrollArea className="flex-1">
                      <div className="px-8">
                        <NewReservationForm 
                          form={form}
                          services={services}
                          staffMembers={staffMembers}
                          reservations={reservations}
                          weekStart={weekStart}
                          weekEnd={weekEnd}
                          days={days}
                          handlePrevWeek={handlePrevWeek}
                          handleNextWeek={handleNextWeek}
                          handleNewReservation={handleNewReservation}
                        />
                      </div>
                    </ScrollArea>

                    <DialogFooter className="px-6 py-4 border-t">
                      <Button onClick={() => setIsConfirmDialogOpen(true)}>
                        {tWithParams("admin-reservation.bookAppointment")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="border-t pt-4 xl:pt-8 flex-1 overflow-hidden">
                  <h3 className="font-medium mb-4 xl:mb-6 text-base xl:text-lg">{t("admin-reservation.calendar.upcomingEvents")}</h3>
                  <ScrollArea className="h-[calc(100%-2rem)]">
                    {reservations
                      .filter(res => {
                        const resDate = new Date(res.start ?? "")
                        return (
                          resDate >= new Date() && 
                          (calendarView === "month" ? isSameMonth(resDate, selectedDate) : true) &&
                          (!selectedStaff || selectedStaff === "all" || res.staffId === Number(selectedStaff))
                        )
                      })
                      .slice(0, 5)
                      .map(res => {
                        const service = services.find(s => s.id === res.serviceId)
                        const staff = staffMembers.find(s => s.id === res.staffId)
                        const startTime = new Date(res.start ?? "")
                        return (
                          <div
                            key={res.id}
                            className="p-3 xl:p-4 text-sm hover:bg-accent rounded-md cursor-pointer mb-2 xl:mb-3 space-y-1 xl:space-y-2"
                            onClick={() => handleReservationClick(res)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-primary">{res.customer.name} {res.customer.surname}</span>
                              <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {startTime.toLocaleDateString(undefined, { 
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </div>
                            </div>
                            <div className="space-y-0.5 xl:space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="text-xs truncate">{service?.name}</div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                  {startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {staff?.firstName} {staff?.lastName}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </ScrollArea>
                </div>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-h-[calc(100vh-8rem)]">
            <div className="flex-1 p-8">
              <div className="container">
                <div className="rounded-lg border bg-card">
                  <div className="p-8">
                    {renderCalendarView()}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Dialogs */}
        <ReservationDetailsDialog 
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          selectedReservation={selectedReservation}
          services={services}
          staffMembers={staffMembers}
          handleCancelReservation={handleCancelReservation}
          t={tWithParams}
          className="sm:max-w-[500px] h-auto max-h-[90vh]"
        />
        <ConfirmationDialog 
          isOpen={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
          form={form}
          services={services}
          staffMembers={staffMembers}
          isSubmitting={isSubmitting}
          handleNewReservation={handleNewReservation}
          t={tWithParams}
        />
        <SuccessDialog 
          isOpen={isSuccessDialogOpen}
          onOpenChange={setIsSuccessDialogOpen}
          form={form}
          setIsNewReservationDialogOpen={setIsNewReservationDialogOpen}
          t={tWithParams}
        />

        {/* Mobile New Reservation Button */}
        {isMobile && (
          <Dialog 
            open={isNewReservationDialogOpen} 
            onOpenChange={(open) => {
              setIsNewReservationDialogOpen(open)
              if (!open) {
                form.reset()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button 
                size="icon" 
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1200px] h-[90vh] flex flex-col overflow-hidden p-0 mx-4">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle>
                  {tWithParams("admin-reservation.newReservation")} - {currentBranch.name}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1">
                <div className="px-8">
                  <NewReservationForm 
                    form={form}
                    services={services}
                    staffMembers={staffMembers}
                    reservations={reservations}
                    weekStart={weekStart}
                    weekEnd={weekEnd}
                    days={days}
                    handlePrevWeek={handlePrevWeek}
                    handleNextWeek={handleNextWeek}
                    handleNewReservation={handleNewReservation}
                  />
                </div>
              </ScrollArea>

              <DialogFooter className="px-6 py-4 border-t">
                <Button onClick={() => setIsConfirmDialogOpen(true)}>
                  {tWithParams("admin-reservation.bookAppointment")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  )
}