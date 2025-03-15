"use client"

import { UseFormReturn } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReservationFormData } from "@/hooks/use-reservation-form"

interface SuccessDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<ReservationFormData>
  setIsNewReservationDialogOpen: (open: boolean) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export function SuccessDialog({
  isOpen,
  onOpenChange,
  form,
  setIsNewReservationDialogOpen,
  t
}: SuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("admin-reservation.reservationConfirmed")}</DialogTitle>
          <DialogDescription>{t("admin-reservation.reservationConfirmedDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p>{t("admin-reservation.reservationConfirmedMail")}: {form.watch("customer.email")}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            onOpenChange(false)
            setIsNewReservationDialogOpen(false)
            form.reset()
          }}>
            {t("admin-reservation.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 