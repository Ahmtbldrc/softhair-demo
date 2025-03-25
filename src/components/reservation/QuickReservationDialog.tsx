"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Service, StaffWithServices, WeeklyHours } from "@/lib/types"
import { format } from "date-fns"
import { UseFormReturn } from "react-hook-form"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { ReservationFormData } from "@/hooks/use-reservation-form"
import { ReservationWithDetails } from "@/lib/types"
import { isSameDay } from "date-fns"

interface QuickReservationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<ReservationFormData>
  services: Service[]
  selectedStaff: StaffWithServices | undefined
  selectedDate: Date
  selectedTime: Date
  onSubmit: (data: ReservationFormData) => void
  isSubmitting: boolean
  t: (key: string, params?: Record<string, string | number>) => string
  reservations: ReservationWithDetails[]
}

export function QuickReservationDialog({
  isOpen,
  onOpenChange,
  form,
  services,
  selectedStaff,
  selectedDate,
  selectedTime,
  onSubmit,
  isSubmitting,
  t,
  reservations
}: QuickReservationDialogProps) {
  // Find the next appointment for the selected staff on the selected date
  const nextAppointment = reservations
    .filter(res => 
      res.staffId === selectedStaff?.id && 
      isSameDay(new Date(res.start ?? ""), selectedDate) &&
      new Date(res.start ?? "") > selectedTime
    )
    .sort((a, b) => new Date(a.start ?? "").getTime() - new Date(b.start ?? "").getTime())[0]

  // Get the current day name
  const currentDay = format(selectedDate, "EEE").toUpperCase() as keyof WeeklyHours

  // Get staff's working hours for the current day
  const workingHours = selectedStaff?.weeklyHours?.[currentDay] || []
  
  // Find the current working period and next break/end time
  const currentWorkingPeriod = workingHours.find(slot => {
    const [startHour, startMinute = "0"] = slot.start.split(':').map(Number)
    const [endHour, endMinute = "0"] = slot.end.split(':').map(Number)
    const startTimeInMinutes = startHour * 60 + Number(startMinute)
    const endTimeInMinutes = endHour * 60 + Number(endMinute)
    const currentTimeInMinutes = selectedTime.getHours() * 60 + selectedTime.getMinutes()
    
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes
  })

  // Calculate the maximum available duration
  let maxDuration: number
  if (!currentWorkingPeriod) {
    // If not in a working period, show no services
    maxDuration = 0
  } else if (nextAppointment) {
    // If there's a next appointment, use that as the limit
    maxDuration = new Date(nextAppointment.start ?? "").getTime() - selectedTime.getTime()
  } else {
    // If no next appointment, use the end of current working period
    const [endHour, endMinute = "0"] = currentWorkingPeriod.end.split(':').map(Number)
    const endTime = new Date(selectedDate)
    endTime.setHours(endHour, Number(endMinute), 0, 0)
    maxDuration = endTime.getTime() - selectedTime.getTime()
  }

  // Filter services based on available time slot
  const staffServices = services.filter(service => {
    // First check if the staff member offers this service
    const staffOffersService = selectedStaff?.services?.some(s => s.service.id === service.id)
    if (!staffOffersService) return false

    // Check if service has a valid duration
    if (!service.duration) return false

    // Check if the service duration fits within the available time slot
    return service.duration * 60 * 1000 <= maxDuration
  })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("admin-reservation.quickBook")} - {format(selectedTime, "HH:mm")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
              {/* Staff Info (Read-only) */}
              <div className="grid gap-2">
                <FormLabel>{t("admin-reservation.staff")}</FormLabel>
                <div className="text-sm text-muted-foreground">
                  {selectedStaff?.firstName} {selectedStaff?.lastName}
                </div>
              </div>

              {/* Service Selection */}
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>{t("admin-reservation.service")}</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("admin-reservation.selectService")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staffServices.map((service) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name} ({service.duration} min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Information */}
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="customer.firstName"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{t("admin-reservation.firstName")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer.lastName"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{t("admin-reservation.lastName")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer.email"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{t("admin-reservation.email")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className="w-full" />
                      </FormControl>
                      {form.formState.errors.customer?.email && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.customer.email.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer.phone"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{t("admin-reservation.phone")}</FormLabel>
                      <FormControl>
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
                      </FormControl>
                      {form.formState.errors.customer?.phone && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.customer.phone.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {t("admin-reservation.bookAppointment")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 