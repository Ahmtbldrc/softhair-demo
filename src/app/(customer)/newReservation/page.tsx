'use client'

import React, { useEffect, useState } from 'react'
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addMinutes, parse, subMinutes } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { TimeSlot, WeeklyHours } from '@/lib/types'
import { useRouter } from 'next/navigation'
import useMail from '@/hooks/use-mail'
import { useLocale } from '@/contexts/LocaleContext' // Add this import
import { getReservationConfirmationTemplate } from '@/lib/email-templates/reservation-confirmation'
import dynamic from 'next/dynamic'
import 'react-phone-input-2/lib/style.css'
import { getActiveStaff } from "@/lib/services/staff.service"
import { createReservation } from "@/lib/services/reservation.service"
import { StaffWithServices } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { LANGUAGES } from "@/lib/constants"
import dayjs from 'dayjs'

interface Branch {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  branchId: number;
}

type Appointment = {
  id: number;
  serviceId: number;
  staffId: number;
  start: Date;
  end: Date;
}

const PhoneInput = dynamic(() => import('react-phone-input-2'), {
  ssr: false
})

export default function NewReservation() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date()) 
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([])

  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const mail = useMail();
  const { t } = useLocale()

  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [staffMembers, setStaffMembers] = useState<StaffWithServices[]>([])

  const [isKvkkDialogOpen, setIsKvkkDialogOpen] = useState(false)
  const [isKvkkAccepted, setIsKvkkAccepted] = useState(false)

  const [isPhoneInputReady, setIsPhoneInputReady] = useState(false)

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branches").select("*")
    if (error) {
      console.error("Error fetching branches:", error)
      toast({
        title: "Error",
        description: t("newReservation.errors.fetchBranches"),
        variant: "destructive",
      })
    } else {
      setBranches(data as Branch[])
    }
  }

  const fetchServices = async () => {
    if (!selectedBranch) return;
    
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq('branchId', selectedBranch)
    
    if (error) {
      console.error("Error fetching services:", error)
      toast({
        title: "Error",
        description: t("newReservation.errors.fetchServices"),
        variant: "destructive",
      })
    } else {
      setServices(data as Service[])
    }
  }

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq('status', true)
      .gte('start', weekStart.toISOString())
      .lte('start', weekEnd.toISOString())
    if (error) {
      console.error("Error fetching appointments:", error)
      toast({
        title: "Error",
        description: t("newReservation.errors.fetchAppointments"),
        variant: "destructive",
      })
    } else {
      setExistingAppointments(data.map(apt => ({
        ...apt,
        start: new Date(apt.start),
        end: new Date(apt.end)
      })))
    }
  }

  const fetchStaffForService = async (serviceId: number) => {
    try {
      if (!selectedBranch) return;
      
      const { data: staffData, error } = await getActiveStaff(selectedBranch)
      
      if (error) {
        toast({
          title: t("newReservation.errors.fetchStaff"),
          variant: "destructive",
        })
        return
      }

      const filteredStaff = staffData?.filter(staff => 
        staff.services.some(s => s.service.id === serviceId)
      ) || []

      setStaffMembers(filteredStaff)
    } catch (error) {
      console.error("Error fetching staff:", error)
      toast({
        title: t("newReservation.errors.fetchStaff"),
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [currentDate])

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      fetchServices()
      setSelectedService(null)
    }
  }, [selectedBranch])

  useEffect(() => {
    setIsClient(true)
    setIsPhoneInputReady(true)
  }, [])

  const handlePrevWeek = () => {
    const prevWeekStart = addDays(currentDate, -7)
    if (prevWeekStart >= startOfWeek(new Date())) {
      setCurrentDate(prevWeekStart)
    }
  }

  const handleNextWeek = () => {
    const nextWeekStart = addDays(currentDate, 7)
    if (nextWeekStart <= addDays(new Date(), 30)) {
      setCurrentDate(nextWeekStart)
    }
  }

  const isStaffWorkingOnDay = (staffId: number, day: Date) => {
    const staffMember = staffMembers.find(s => s.id === staffId)
    if (!staffMember) return false
    const dayName = format(day, 'EEE').toUpperCase()
    return staffMember.weeklyHours && staffMember.weeklyHours[dayName as keyof WeeklyHours] && staffMember.weeklyHours[dayName as keyof WeeklyHours].length > 0
  }

  const getStaffWorkingHours = (staffId: number, day: Date): TimeSlot[] | null => {
    const staffMember = staffMembers.find(s => s.id === staffId)
    if (!staffMember || !staffMember.weeklyHours) return null
    const dayName = format(day, 'EEE').toUpperCase()
    return staffMember.weeklyHours[dayName as keyof WeeklyHours] || null
  }

  const getAvailableTimesForDay = (day: Date) => {
    if (!selectedService || !selectedStaff) return []

    const service = services.find(s => s.id === selectedService)
    if (!service) return []

    const workingHours = getStaffWorkingHours(selectedStaff, day)
    if (!workingHours || workingHours.length === 0) return []

    const availableTimes: { time: Date; available: boolean }[] = []
    const now = new Date()
    const oneMonthFromNow = addDays(now, 30)

    workingHours.forEach(slot => {
      let currentTime = parse(slot.start, 'HH:mm', day)
      const endTime = parse(slot.end, 'HH:mm', day)

      while (currentTime <= subMinutes(endTime, 15)) {
        const hasConflict = existingAppointments.some((apt) => {
          const aptStart = new Date(apt.start)
          const aptEnd = new Date(apt.end)
          const slotTime = new Date(currentTime)
          const slotEndTime = addMinutes(slotTime, service.duration)
          
          const isBeforeAppointment = slotTime < aptStart && slotEndTime > aptStart
          const isDuringAppointment = slotTime >= aptStart && slotTime < aptEnd
          
          return (
            apt.staffId === selectedStaff &&
            isSameDay(aptStart, day) &&
            (isBeforeAppointment || isDuringAppointment)
          )
        })

        const isPastDateTime = currentTime < now
        const isFutureDateTime = currentTime > oneMonthFromNow

        availableTimes.push({
          time: new Date(currentTime),
          available: !hasConflict && !isPastDateTime && !isFutureDateTime
        })

        currentTime = addMinutes(currentTime, 15)
      }
    })

    return availableTimes
  }

  const handleReservation = async () => {
    if (!selectedService || !selectedStaff || !selectedTime || !selectedBranch) {
      toast({
        title: "Error",
        description: t("newReservation.errors.selectAll"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const service = services.find(s => s.id === selectedService)
    if (!service) {
      toast({
        title: "Error",
        description: t("newReservation.errors.serviceNotFound"),
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Check if customer exists with the provided email
    const { data: existingCustomer, error: customerCheckError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerInfo.email)
      .single()

    if (customerCheckError && customerCheckError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error("Error checking customer:", customerCheckError)
      toast({
        title: "Error",
        description: t("newReservation.errors.checkCustomer"),
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }
    
    const reservationData = {
      serviceId: selectedService,
      staffId: selectedStaff,
      branchId: selectedBranch,
      start: dayjs(selectedTime).format('YYYY-MM-DD HH:mm:ss'),
      customer: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
      },
      status: true
    }

    // If customer exists, use their existing record
    if (existingCustomer) {
      reservationData.customer = {
        firstName: existingCustomer.name,
        lastName: existingCustomer.surname,
        email: existingCustomer.email,
        phone: existingCustomer.phone || customerInfo.phone,
      }
    }

    const { error } = await createReservation(reservationData)

    if (error) {
      console.error("Error creating reservation:", error)
      toast({
        title: "Error",
        description: t("newReservation.errors.createReservation"),
        variant: "destructive",
      })
    } else {
      setIsSuccessDialogOpen(true)
    }

    mail.sendMail({
      to: customerInfo.email,
      subject: `Bestätigung Ihrer Reservation bei Styling Lounge 61 - ${format(selectedTime, "dd.MM.yyyy")} um ${format(selectedTime, "HH:mm")}`,
      html: getReservationConfirmationTemplate(
        selectedTime,
        service?.name || '',
        service?.price || 0,
        staffMembers.find(s => s.id === selectedStaff)?.firstName || '',
        staffMembers.find(s => s.id === selectedStaff)?.lastName || '',
        reservationData.customer.firstName || ''
      )
    })
    setIsSubmitting(false)
    setIsConfirmDialogOpen(false)
  }

  const resetForm = () => {
    setSelectedService(null)
    setSelectedStaff(null)
    setSelectedTime(null)
    setCustomerInfo({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    })
    setCurrentDate(new Date())
  }

  const handleServiceChange = (serviceId: number) => {
    setSelectedService(serviceId)
    setSelectedStaff(null)
    fetchStaffForService(serviceId)
  }

  // Loading durumunu en üstte kontrol edelim
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white">{t("common.loading")}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <Card className="w-full max-w-[90%] md:max-w-[60%]">
        <CardHeader>
          <CardTitle>{t("newReservation.title")}</CardTitle>
          <CardDescription>{t("newReservation.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="branch">{t("newReservation.selectBranch")}</Label>
              <Select 
                onValueChange={(value) => {
                  setSelectedBranch(Number(value))
                  setSelectedService(null)
                  setSelectedStaff(null)
                  setSelectedTime(null)
                }}
              >
                <SelectTrigger id="branch">
                  <SelectValue placeholder={t("newReservation.chooseBranch")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBranch && (
              <div>
                <Label htmlFor="service">{t("newReservation.selectService")}</Label>
                <Select 
                  value={selectedService?.toString()}
                  onValueChange={(value) => handleServiceChange(Number(value))}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder={t("newReservation.chooseService")} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} ({service.price} €)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedService && (
              <div>
                <Label>{t("newReservation.selectStaff")}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
                  {staffMembers.map((staffMember) => (
                    <Card 
                      key={staffMember.id} 
                      className={`cursor-pointer transition-all ${selectedStaff === staffMember.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => {
                        setSelectedStaff(staffMember.id)
                        setSelectedTime(null)
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
                        />
                        <p className="text-center text-sm font-medium mb-2">{`${staffMember.firstName} ${staffMember.lastName}`}</p>
                        
                        {/* Dil badge'leri */}
                        <div className="flex flex-wrap gap-2 justify-center">
                          {staffMember.languages?.map((langId) => {
                            const language = LANGUAGES.find(l => l.id === langId)
                            if (!language) return null
                            
                            return (
                              <Badge
                                key={langId}
                                variant="secondary"
                                className="rounded-full p-0 w-8 h-8 overflow-hidden"
                                title={language.name}
                              >
                                <Image
                                  src={`https://flagcdn.com/${language.countryCode.toLowerCase()}.svg`}
                                  alt={language.name}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              </Badge>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {selectedService && selectedStaff && (
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                  <Button onClick={handlePrevWeek} className="mb-2 sm:mb-0">
                    &lt; {t("newReservation.previousWeek")}
                  </Button>
                  <h2 className="text-lg font-semibold text-center">
                    {format(weekStart, 'dd.MM.yyyy')} - {format(weekEnd, 'dd.MM.yyyy')}
                  </h2>
                  <Button onClick={handleNextWeek} className="mt-2 sm:mt-0">
                    {t("newReservation.nextWeek")} &gt;
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 select-none">
                  {days.map((day) => (
                    <Card key={day.toString()} className="p-2">
                      <CardHeader className="p-2">
                        <CardTitle className="text-sm">{format(day, 'EEE')}</CardTitle>
                        <p className="text-xs text-muted-foreground">{format(day, 'MMM d')}</p>
                      </CardHeader>
                      <CardContent className="p-2">
                        <ScrollArea className="h-32 sm:h-40">
                          {isStaffWorkingOnDay(selectedStaff, day) ? (
                            getAvailableTimesForDay(day).map(({ time, available }) => {
                              const isPastDateTime = time < new Date()
                              const isFutureDateTime = time > addDays(new Date(), 30)
                              return (
                                <Button
                                  key={time.toISOString()}
                                  variant="outline"
                                  className={`w-full mb-1 ${
                                    isPastDateTime || isFutureDateTime
                                      ? 'line-through text-muted-foreground hover:no-underline cursor-not-allowed'
                                      : available 
                                        ? selectedTime && isSameDay(selectedTime, time) && selectedTime.getTime() === time.getTime()
                                          ? 'bg-green-500 text-white hover:bg-green-600'
                                          : 'hover:bg-green-100'
                                        : existingAppointments.some(apt => {
                                            const aptStart = new Date(apt.start)
                                            const aptEnd = new Date(apt.end)
                                            return isSameDay(aptStart, time) && time >= aptStart && time < aptEnd
                                          })
                                          ? 'bg-red-100 cursor-not-allowed'
                                          : 'opacity-50 text-muted-foreground hover:no-underline cursor-not-allowed'
                                  }`}
                                  onClick={() => !isPastDateTime && !isFutureDateTime && available && setSelectedTime(time)}
                                  disabled={isPastDateTime || isFutureDateTime || !available}
                                >
                                  {format(time, 'HH:mm')}
                                </Button>
                              )
                            })
                          ) : (
                            <p className="text-xs text-muted-foreground">{t("newReservation.notAvailable")}</p>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {selectedTime && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("newReservation.customerInformation")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t("newReservation.firstName")}</Label>
                    <Input
                      id="firstName"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t("newReservation.lastName")}</Label>
                    <Input
                      id="lastName"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t("newReservation.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t("newReservation.phone")}</Label>
                    {isPhoneInputReady ? (
                      <PhoneInput
                        country={'de'}
                        value={customerInfo.phone}
                        onChange={(phone) => setCustomerInfo({
                          ...customerInfo,
                          phone: phone
                        })}
                        inputClass="!w-full !h-10 !text-base !border-input !bg-background !text-foreground"
                        containerClass="!w-full"
                        buttonClass="!h-10 !border-input !bg-background"
                        dropdownClass="!bg-popover !text-foreground"
                        searchClass="!bg-background !text-foreground"
                        enableSearch={true}
                        inputProps={{
                          id: 'phone',
                        }}
                        inputStyle={{
                          width: '100%',
                          height: '40px',
                          fontSize: '16px',
                          borderRadius: '6px',
                        }}
                        buttonStyle={{
                          borderRadius: '6px 0 0 6px',
                        }}
                      />
                    ) : (
                      <div className="h-10 bg-background rounded-md animate-pulse" />
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="kvkk"
                        checked={isKvkkAccepted}
                        onCheckedChange={(checked: boolean) => {
                          setIsKvkkAccepted(checked)
                        }}
                      />
                      <label
                        htmlFor="kvkk"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        {t("newReservation.kvkkConsent").split(/\b(Datenschutzbestimmungen|Personal Data Protection Law terms)\b/).map((part, index) => {
                          if (part === "Datenschutzbestimmungen" || part === "Personal Data Protection Law terms") {
                            return (
                              <span
                                key={index}
                                className="underline cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setIsKvkkDialogOpen(true)
                                }}
                              >
                                {part}
                              </span>
                            )
                          }
                          return part
                        })}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                disabled={!selectedTime || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !isKvkkAccepted}
              >
                {t("newReservation.bookAppointment")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("newReservation.confirmTitle")}</DialogTitle>
                <DialogDescription>{t("newReservation.confirmDescription")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p><strong>{t("newReservation.service")}:</strong> {services.find(s => s.id === selectedService)?.name}</p>
                <p><strong>{t("newReservation.staff")}:</strong> {staffMembers.find(s => s.id === selectedStaff)?.firstName} {staffMembers.find(s => s.id === selectedStaff)?.lastName}</p>
                <p><strong>{t("newReservation.dateTime")}:</strong> {selectedTime && format(selectedTime, 'MMMM d, yyyy HH:mm')}</p>
                <p><strong>{t("newReservation.name")}:</strong> {customerInfo.firstName} {customerInfo.lastName}</p>
                <p><strong>{t("newReservation.email")}:</strong> {customerInfo.email}</p>
                <p><strong>{t("newReservation.phone")}:</strong> {customerInfo.phone}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                  {t("newReservation.cancel")}
                </Button>
                <Button onClick={handleReservation} disabled={isSubmitting}>
                  {isSubmitting ? t("newReservation.confirming") : t("newReservation.confirmReservation")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("newReservation.successTitle")}</DialogTitle>
            <DialogDescription>
              {t("newReservation.successDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => {
              setIsSuccessDialogOpen(false)
              resetForm()
              router.push('/')
            }}>
              {t("newReservation.returnToMain")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isKvkkDialogOpen} onOpenChange={setIsKvkkDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("newReservation.kvkkTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {t("newReservation.kvkkText")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKvkkDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setIsKvkkAccepted(true)
                setIsKvkkDialogOpen(false)
              }}
            >
              {t("newReservation.kvkkAccept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}