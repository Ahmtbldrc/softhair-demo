"use client"

import { format, addMinutes } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Service, StaffWithServices, ReservationWithDetails } from "@/lib/types"

interface ReservationDetailsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedReservation: ReservationWithDetails | null
  services: Service[]
  staffMembers: StaffWithServices[]
  handleCancelReservation: (reservationId: number) => Promise<void>
  t: (key: string, params?: Record<string, string | number>) => string
  className?: string
}

export function ReservationDetailsDialog({
  isOpen,
  onOpenChange,
  selectedReservation,
  services,
  staffMembers,
  handleCancelReservation,
  t
}: ReservationDetailsDialogProps) {
  if (!selectedReservation) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("admin-reservation.reservationDetails")}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{services.find(s => s.id === selectedReservation.serviceId)?.name}</CardTitle>
              <CardDescription>
                {format(new Date(selectedReservation.start ?? ""), "MMMM d, yyyy")} {t("admin-reservation.at")} {format(new Date(selectedReservation.start ?? ""), "HH:mm")} - {format(addMinutes(new Date(selectedReservation.end ?? ""), 1), "HH:mm")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar>
                  <AvatarImage src={staffMembers.find(s => s.id === selectedReservation.staffId)?.image || undefined} />
                  <AvatarFallback>{staffMembers.find(s => s.id === selectedReservation.staffId)?.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{t("admin-reservation.staff")}</h3>
                  <div className="flex items-center gap-2">
                    <p>
                      {staffMembers.find(s => s.id === selectedReservation.staffId)?.firstName} 
                      {staffMembers.find(s => s.id === selectedReservation.staffId)?.lastName}
                    </p>
                    {!staffMembers.find(s => s.id === selectedReservation.staffId)?.status && (
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">{t("admin-reservation.service")}</h3>
                <p>{services.find(s => s.id === selectedReservation.serviceId)?.name}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">{t("admin-reservation.price")}</h3>
                <p>{services.find(s => s.id === selectedReservation.serviceId)?.price} €</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">{t("admin-reservation.customer")}</h3>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{selectedReservation.customer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedReservation.customer.name} {selectedReservation.customer.surname}</h3>
                    <p className="text-sm text-muted-foreground">{selectedReservation.customer.email}</p>
                    {selectedReservation.customer.phone && (
                      <p className="text-sm text-muted-foreground">{selectedReservation.customer.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">{t("admin-reservation.cancelReservation")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("admin-reservation.confirmCancellationDescription")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("admin-reservation.confirmCancellationDescription-2")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("admin-reservation.noKeepReservation")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleCancelReservation(selectedReservation.id)}>
                      {t("admin-reservation.yesCancelReservation")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 