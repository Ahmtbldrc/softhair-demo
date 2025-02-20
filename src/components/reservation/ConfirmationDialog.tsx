"use client"

import { format } from "date-fns"
import { UseFormReturn } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Service, StaffWithServices } from "@/lib/types"
import { ReservationFormData } from "@/hooks/use-reservation-form"

interface ConfirmationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<ReservationFormData>
  services: Service[]
  staffMembers: StaffWithServices[]
  isSubmitting: boolean
  handleNewReservation: (data: ReservationFormData) => Promise<void>
  t: (key: string, params?: Record<string, string | number>) => string
}

export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  form,
  services,
  staffMembers,
  isSubmitting,
  handleNewReservation,
  t
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("admin-reservation.confirmDialogTitle")}</DialogTitle>
          <DialogDescription>{t("admin-reservation.confirmDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p><strong>{t("admin-reservation.service")}:</strong> {services.find(s => s.id === form.watch("serviceId"))?.name}</p>
          <p><strong>{t("admin-reservation.staff")}:</strong> {staffMembers.find(s => s.id === form.watch("staffId"))?.firstName} {staffMembers.find(s => s.id === form.watch("staffId"))?.lastName}</p>
          <p><strong>{t("admin-reservation.dateAndTime")}:</strong> {form.watch("start") && format(form.watch("start"), "MMMM d, yyyy HH:mm")}</p>
          <p><strong>{t("admin-reservation.customer")}:</strong> {form.watch("customer.firstName")} {form.watch("customer.lastName")}</p>
          <p><strong>{t("admin-reservation.email")}:</strong> {form.watch("customer.email")}</p>
          <p><strong>{t("admin-reservation.phone")}:</strong> {form.watch("customer.phone")}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {t("admin-reservation.edit")}
          </Button>
          <Button onClick={form.handleSubmit(handleNewReservation)} disabled={isSubmitting}>
            {isSubmitting ? t("admin-reservation.booking") : t("admin-reservation.confirmBooking")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 