"use client"

import { UseFormReturn } from "react-hook-form"
import { format, isSameDay, addDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { ReservationFormData } from "@/hooks/use-reservation-form"
import { Service, StaffWithServices, ReservationWithDetails } from "@/lib/types"
import { isStaffWorkingOnDay, getAvailableTimesForDay } from "@/lib/utils/staff-hours"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { useLocale } from "@/contexts/LocaleContext"

interface NewReservationFormProps {
  form: UseFormReturn<ReservationFormData>
  services: Service[]
  staffMembers: StaffWithServices[]
  reservations: ReservationWithDetails[]
  weekStart: Date
  weekEnd: Date
  days: Date[]
  handlePrevWeek: () => void
  handleNextWeek: () => void
  handleNewReservation: (data: ReservationFormData) => Promise<void>
}

export function NewReservationForm({
  form,
  services,
  staffMembers,
  reservations,
  weekStart,
  weekEnd,
  days,
  handlePrevWeek,
  handleNextWeek,
  handleNewReservation,
}: NewReservationFormProps) {
  const { t } = useLocale()
  return (
    <form onSubmit={form.handleSubmit(handleNewReservation)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t("admin-reservation.customerInformation")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">{t("admin-reservation.firstName")}</Label>
            <Input
              id="firstName"
              {...form.register("customer.firstName")}
              className="w-full"
            />
            {form.formState.errors.customer?.firstName && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.customer.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">{t("admin-reservation.lastName")}</Label>
            <Input
              id="lastName"
              {...form.register("customer.lastName")}
              className="w-full"
            />
            {form.formState.errors.customer?.lastName && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.customer.lastName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">{t("admin-reservation.email")}</Label>
            <Input
              id="email"
              type="email"
              {...form.register("customer.email")}
              className="w-full"
            />
            {form.formState.errors.customer?.email && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.customer.email.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">{t("admin-reservation.phone")}</Label>
            <PhoneInput
              country={"ch"}
              value={form.watch("customer.phone")}
              onChange={(phone) => form.setValue("customer.phone", phone)}
              inputClass="!w-full !h-10 !text-base !border-input !bg-background !text-foreground !rounded-md !border-[1px] focus:!ring-2 focus:!ring-ring focus:!ring-offset-0"
              containerClass="!w-full"
              buttonClass="!h-10 !border-input !bg-background !border-[1px] !border-r-0"
              dropdownClass="!bg-popover !text-foreground"
              searchClass="!bg-background !text-foreground"
              enableSearch={true}
              inputProps={{
                id: "phone",
                required: false,
              }}
              inputStyle={{
                width: "100%",
                height: "40px",
                fontSize: "16px",
                borderRadius: "6px",
              }}
              buttonStyle={{
                borderRadius: "6px 0 0 6px",
                borderRight: "none",
              }}
            />
            {form.formState.errors.customer?.phone && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.customer.phone.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div>
        <Label htmlFor="service">{t("admin-reservation.selectService")}</Label>
        <Select 
          onValueChange={(value) => {
            form.setValue("serviceId", Number(value))
            form.setValue("staffId", 0)
            form.setValue("start", new Date())
          }}
        >
          <SelectTrigger id="service">
            <SelectValue placeholder={t("admin-reservation.selectService")} />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id.toString()}>
                {service.name} ({service.price} €)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.serviceId && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.serviceId.message}
          </p>
        )}
      </div>
      {form.watch("serviceId") > 0 && (
        <div>
          <Label>{t("admin-reservation.selectStaff")}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
            {staffMembers
              .filter(staffMember => 
                staffMember.status && 
                staffMember.services.some(s => s.service.id === form.watch("serviceId"))
              )
              .map((staffMember) => (
                <Card 
                  key={staffMember.id} 
                  className={`cursor-pointer transition-all ${form.watch("staffId") === staffMember.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => {
                    form.setValue("staffId", staffMember.id)
                    form.setValue("start", new Date())
                  }}
                >
                  <CardContent className="flex flex-col items-center p-4">
                    <Image
                      src={`https://rlffvcspggzfedokaqsr.supabase.co/storage/v1/object/public/staff/${staffMember.image}`}
                      alt={`${staffMember.firstName} ${staffMember.lastName}`}
                      width={100}
                      height={100}
                      className="rounded-md mb-2"
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.src = "https://www.gravatar.com/avatar/000?d=mp&f=y";
                      }}
                    />
                    <p className="text-center text-sm">{`${staffMember.firstName} ${staffMember.lastName}`}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
          {form.formState.errors.staffId && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.staffId.message}
            </p>
          )}
        </div>
      )}

      {form.watch("serviceId") > 0 && form.watch("staffId") > 0 && (
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <Button onClick={handlePrevWeek} type="button" className="mb-2 sm:mb-0">&lt; {t("admin-reservation.previousWeek")}</Button>
            <h2 className="text-lg font-semibold text-center">
              {format(weekStart, "dd.MM.yyyy")} - {format(weekEnd, "dd.MM.yyyy")}
            </h2>
            <Button onClick={handleNextWeek} type="button" className="mt-2 sm:mt-0">{t("admin-reservation.nextWeek")} &gt;</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 select-none">
            {days.map((day) => (
              <Card key={day.toString()} className="p-2">
                <CardHeader className="p-2">
                  <CardTitle className="text-sm">{format(day, "EEE")}</CardTitle>
                  <p className="text-xs text-muted-foreground">{format(day, "MMM d")}</p>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-48 sm:h-56">
                    {form.watch("staffId") && isStaffWorkingOnDay(staffMembers.find(s => s.id === form.watch("staffId")), day) ? (
                      getAvailableTimesForDay(
                        day,
                        staffMembers.find(s => s.id === form.watch("staffId")),
                        reservations,
                        services.find(s => s.id === form.watch("serviceId"))?.duration ?? 30
                      ).map((timeSlot) => {
                        const isPastDateTime = timeSlot.time < new Date()
                        const isFutureDateTime = timeSlot.time > addDays(new Date(), 30)
                        return (
                          <Button
                            key={timeSlot.time.toISOString()}
                            type="button"
                            variant="outline"
                            className={`w-full mb-1 ${
                              isPastDateTime || isFutureDateTime
                                ? "line-through text-muted-foreground hover:no-underline cursor-not-allowed"
                                : timeSlot.available 
                                  ? form.watch("start") &&
                                    isSameDay(form.watch("start"), timeSlot.time) &&
                                    form.watch("start").getTime() === timeSlot.time.getTime()
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : timeSlot.warning
                                      ? "border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                                      : "hover:bg-green-100"
                                  : timeSlot.isOccupied
                                    ? "bg-red-100 text-red-700 cursor-not-allowed"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                            onClick={() => !isPastDateTime && !isFutureDateTime && timeSlot.available && form.setValue("start", timeSlot.time)}
                            disabled={isPastDateTime || isFutureDateTime || !timeSlot.available}
                          >
                            {format(timeSlot.time, "HH:mm")}
                          </Button>
                        )
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground">{t("admin-reservation.notAvailable")}</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </form>
  )
} 