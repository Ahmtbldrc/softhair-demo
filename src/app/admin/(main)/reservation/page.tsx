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

export default function AppointmentCalendar() {
  const { t } = useLocale()
  const { selectedBranchId } = useBranch()
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
    groupReservationsByTime
  } = useReservationCalendar(selectedBranchId, tWithParams)

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="container mx-auto p-4 space-y-8">
          <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
                <CardTitle>{tWithParams("admin-reservation.reservationCalendar")}</CardTitle>
                <CardDescription>{tWithParams("admin-reservation.reservationCalendarDescription")}</CardDescription>
        </div>
        <Dialog open={isNewReservationDialogOpen} onOpenChange={setIsNewReservationDialogOpen}>
          <DialogTrigger asChild>
                  <Button>{tWithParams("admin-reservation.newReservation")}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader>
                    <DialogTitle>{tWithParams("admin-reservation.newReservation")}</DialogTitle>
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
              />
              
              <WeekCalendar 
                days={days}
                sortedReservations={reservations}
                services={services}
                staffMembers={staffMembers}
                handleReservationClick={handleReservationClick}
                groupReservationsByTime={groupReservationsByTime}
              />

              <ReservationDetailsDialog 
                isOpen={isDetailsDialogOpen}
                onOpenChange={setIsDetailsDialogOpen}
                selectedReservation={selectedReservation}
                services={services}
                staffMembers={staffMembers}
                handleCancelReservation={handleCancelReservation}
                t={tWithParams}
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
              </CardContent>
            </Card>
        </div>
      </main>
            </div>
  )
}