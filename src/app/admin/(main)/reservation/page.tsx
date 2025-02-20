"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  ReservationDetailsDialog,
  ConfirmationDialog,
  SuccessDialog
} from "@/components/reservation"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { isSameDay } from "date-fns"
import { ReservationWithDetails } from "@/lib/types"

const DailyNavigation = ({ selectedDate, setSelectedDate }: { 
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}) => {
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

  return (
    <div className="flex items-center justify-between mb-4">
      <Button variant="outline" onClick={handlePrevDay}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="font-medium">
        {selectedDate.toLocaleDateString()}
      </div>
      <Button variant="outline" onClick={handleNextDay}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function AppointmentCalendar() {
  const { t } = useLocale()
  const { selectedBranchId, branches } = useBranch()
  const tWithParams = t as (key: string, params?: Record<string, string | number>) => string

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
  } = useReservationCalendar(selectedBranchId, tWithParams)

  // Get the current branch information
  const currentBranch = branches.find(branch => branch.id === selectedBranchId)

  if (!currentBranch) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center">
        <p className="text-lg text-muted-foreground">{t("admin-reservation.selectBranch")}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="container mx-auto p-4 space-y-8">
          {isMobile ? (
            <>
              <DailyNavigation 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
              <StaffSelector 
                staffMembers={staffMembers}
                selectedStaff={selectedStaff}
                setSelectedStaff={setSelectedStaff}
                t={tWithParams}
                isMobile={isMobile}
              />
              <WeekCalendar 
                days={[selectedDate]}
                sortedReservations={reservations.filter((res: ReservationWithDetails) => 
                  (!selectedStaff || selectedStaff === "all" || res.staffId === Number(selectedStaff)) &&
                  isSameDay(new Date(res.start ?? ""), selectedDate)
                )}
                services={services}
                staffMembers={staffMembers}
                selectedStaff={selectedStaff}
                handleReservationClick={handleReservationClick}
                groupReservationsByTime={groupReservationsByTime}
                isMobile={true}
              />
            </>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{tWithParams("admin-reservation.reservationCalendar")}</CardTitle>
                  <CardDescription>
                    {tWithParams("admin-reservation.reservationCalendarDescription")} - {currentBranch.name}
                  </CardDescription>
                </div>
                <Dialog open={isNewReservationDialogOpen} onOpenChange={setIsNewReservationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>{tWithParams("admin-reservation.newReservation")}</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>
                        {tWithParams("admin-reservation.newReservation")} - {currentBranch.name}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <ScrollArea className="flex-1 px-4">
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
                        t={tWithParams}
                      />
                    </ScrollArea>

                    <DialogFooter className="mt-4 px-4 py-2">
                      <Button onClick={() => setIsConfirmDialogOpen(true)}>
                        {tWithParams("admin-reservation.bookAppointment")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <WeekNavigation 
                  weekStart={weekStart}
                  weekEnd={weekEnd}
                  handlePrevWeek={handlePrevWeek}
                  handleNextWeek={handleNextWeek}
                />
                <StaffSelector 
                  staffMembers={staffMembers}
                  selectedStaff={selectedStaff}
                  setSelectedStaff={setSelectedStaff}
                  t={tWithParams}
                  isMobile={isMobile}
                />
                <WeekCalendar 
                  days={days}
                  sortedReservations={reservations}
                  services={services}
                  staffMembers={staffMembers}
                  selectedStaff={selectedStaff}
                  handleReservationClick={handleReservationClick}
                  groupReservationsByTime={groupReservationsByTime}
                  isMobile={false}
                />
              </CardContent>
            </Card>
          )}
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
        </div>
        {isMobile && (
          <Dialog open={isNewReservationDialogOpen} onOpenChange={setIsNewReservationDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="icon" 
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle>
                  {t("admin-reservation.newReservation")}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 px-4">
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
                  t={tWithParams}
                />
              </ScrollArea>
              <DialogFooter className="mt-4 px-4 py-2">
                <Button onClick={() => setIsConfirmDialogOpen(true)}>
                  {t("admin-reservation.bookAppointment")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}