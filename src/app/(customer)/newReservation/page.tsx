'use client'

import React, { useEffect, useState } from 'react'
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addMinutes, isWithinInterval, parse } from 'date-fns'
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
import { StaffType, TimeSlot } from '@/lib/types'
import { useRouter } from 'next/navigation'
import useMail from '@/hooks/use-mail'

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
}

type Appointment = {
  id: number;
  serviceId: number;
  staffId: number;
  start: Date;
  end: Date;
}

export default function NewReservation() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date()) 
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [staff, setStaff] = useState<StaffType[]>([])
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

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("*")
    if (error) {
      console.error("Error fetching services:", error)
      toast({
        title: "Error",
        description: "Failed to fetch services. Please try again.",
        variant: "destructive",
      })
    } else {
      setServices(data as Service[])
    }
  }

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("*, services:staff_services(service:service_id(id, name))")
    if (error) {
      console.error("Error fetching staff:", error)
      toast({
        title: "Error",
        description: "Failed to fetch staff. Please try again.",
        variant: "destructive",
      })
    } else {
      setStaff(data as StaffType[])
    }
  }

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .gte('start', weekStart.toISOString())
      .lte('start', weekEnd.toISOString())
    if (error) {
      console.error("Error fetching appointments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch existing appointments. Please try again.",
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

  useEffect(() => {
    fetchAppointments()
  }, [weekStart, weekEnd])

  useEffect(() => {
    fetchServices()
    fetchStaff()
  }, [selectedService])  

  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7))
  }

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7))
  }

  const isStaffWorkingOnDay = (staffId: number, day: Date) => {
    const staffMember = staff.find(s => s.id === staffId)
    if (!staffMember) return false
    const dayName = format(day, 'EEE').toUpperCase()
    return staffMember.weeklyHours && staffMember.weeklyHours[dayName] && staffMember.weeklyHours[dayName].length > 0
  }

  const getStaffWorkingHours = (staffId: number, day: Date): TimeSlot[] | null => {
    const staffMember = staff.find(s => s.id === staffId)
    if (!staffMember || !staffMember.weeklyHours) return null
    const dayName = format(day, 'EEE').toUpperCase()
    return staffMember.weeklyHours[dayName] || null
  }

  const getAvailableTimesForDay = (day: Date) => {
    if (!selectedService || !selectedStaff) return []

    const service = services.find(s => s.id === selectedService)
    if (!service) return []

    const workingHours = getStaffWorkingHours(selectedStaff, day)
    if (!workingHours || workingHours.length === 0) return []

    const availableTimes: { time: Date; available: boolean }[] = []

    workingHours.forEach(slot => {
      let currentTime = parse(slot.start, 'HH:mm', day)
      const endTime = parse(slot.end, 'HH:mm', day)

      while (currentTime < endTime) {
        const slotEndTime = addMinutes(currentTime, 60) // Always use 60-minute intervals
        const isAvailable = !existingAppointments.some(apt => 
          apt.staffId === selectedStaff &&
          isSameDay(apt.start, day) &&
          (isWithinInterval(currentTime, { start: apt.start, end: apt.end }) ||
          isWithinInterval(slotEndTime, { start: apt.start, end: apt.end }) ||
          (currentTime <= apt.start && slotEndTime >= apt.end))
        )

        availableTimes.push({ time: new Date(currentTime), available: isAvailable })
        currentTime = slotEndTime
      }
    })

    return availableTimes
  }

  const handleReservation = async () => {
    if (!selectedService || !selectedStaff || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select a service, staff, and time.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const service = services.find(s => s.id === selectedService)
    if (!service) {
      toast({
        title: "Error",
        description: "Selected service not found.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const endTime = addMinutes(selectedTime, 59)

    const newReservation = {
      serviceId: selectedService,
      staffId: selectedStaff,
      start: selectedTime,
      end: endTime,
      customer: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
      }
    }

    const { error } = await supabase
      .from('reservations')
      .insert([newReservation])

    if (error) {
      console.error("Error creating reservation:", error)
      toast({
        title: "Error",
        description: "Failed to create reservation. Please try again.",
        variant: "destructive",
      })
    } else {
      setIsSuccessDialogOpen(true)
    }

    mail.sendMail({
      to: customerInfo.email,
      subject: 'Appointment Confirmation',
      html: `
        <p>Hi ${customerInfo.firstName},</p>
        <p>Your appointment has been successfully booked for ${format(selectedTime, 'MMMM d, yyyy HH:mm')}.</p>
        <p>Service: ${service.name}</p>
        <p>Staff: ${staff.find(s => s.id === selectedStaff)?.firstName} ${staff.find(s => s.id === selectedStaff)?.lastName}</p>
        <p>Price: $${service.price}</p>
        <p>Duration: ${service.duration} minutes</p>
        <p>Email:
          <a href="mailto:${staff.find(s => s.id === selectedStaff)?.email}">
            ${staff.find(s => s.id === selectedStaff)?.email}
          </a>
        </p>
        `
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-whitep-4">
      <Card className="w-full max-w-[60%]">
        <CardHeader>
          <CardTitle>New Reservation</CardTitle>
          <CardDescription>Book your appointment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="service">Select Service</Label>
              <Select 
                onValueChange={(value) => {
                  setSelectedService(Number(value))
                  setSelectedStaff(null)
                  setSelectedTime(null)
                }}
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} (${service.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedService && (
              <div>
                <Label>Select Staff</Label>
                <div className="grid grid-cols-6 gap-4 mt-2">
                  {staff
                    .filter(staffMember => 
                      staffMember.services.some(s => s.service.id === selectedService)
                    )
                    .map((staffMember) => (
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
                            src={`https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staffMember.image}?t=${new Date().getTime()}`}
                            alt={`${staffMember.firstName} ${staffMember.lastName}`}
                            width={100}
                            height={100}
                            className="rounded-md mb-2"
                          />
                          <p className="font-semibold text-center">{`${staffMember.firstName} ${staffMember.lastName}`}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
          {selectedService && selectedStaff && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <Button onClick={handlePrevWeek}>&lt; Previous Week</Button>
                <h2 className="text-lg font-semibold">
                  {format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
                </h2>
                <Button onClick={handleNextWeek}>Next Week &gt;</Button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => (
                  <Card key={day.toString()} className="p-2">
                    <CardHeader className="p-2">
                      <CardTitle className="text-sm">{format(day, 'EEE')}</CardTitle>
                      <p className="text-xs text-muted-foreground">{format(day, 'MMM d')}</p>
                    </CardHeader>
                    <CardContent className="p-2">
                      <ScrollArea className="h-32">
                        {isStaffWorkingOnDay(selectedStaff, day) ? (
                          getAvailableTimesForDay(day).map(({ time, available }) => (
                            <Button
                              key={time.toISOString()}
                              variant="outline"
                              className={`w-full mb-1 ${
                                available 
                                  ? selectedTime && isSameDay(selectedTime, time) && selectedTime.getTime() === time.getTime()
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'hover:bg-green-100'
                                  : 'bg-red-100 cursor-not-allowed'
                              }`}
                              onClick={() => available && setSelectedTime(time)}
                              disabled={!available}
                            >
                              {format(time, 'HH:mm')}
                            </Button>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">Not available</p>
                
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" disabled={!selectedTime || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone}>
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Your Reservation</DialogTitle>
                <DialogDescription>Please review your reservation details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p><strong>Service:</strong> {services.find(s => s.id === selectedService)?.name}</p>
                <p><strong>Staff:</strong> {staff.find(s => s.id === selectedStaff)?.firstName} {staff.find(s => s.id === selectedStaff)?.lastName}</p>
                <p><strong>Date & Time:</strong> {selectedTime && format(selectedTime, 'MMMM d, yyyy HH:mm')}</p>
                <p><strong>Name:</strong> {customerInfo.firstName} {customerInfo.lastName}</p>
                <p><strong>Email:</strong> {customerInfo.email}</p>
                <p><strong>Phone:</strong> {customerInfo.phone}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleReservation} disabled={isSubmitting}>
                  {isSubmitting ? 'Confirming...' : 'Confirm Reservation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservation Completed</DialogTitle>
            <DialogDescription>
              Your reservation has been successfully made. Please check your email for confirmation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => {
              setIsSuccessDialogOpen(false)
              resetForm()
              router.push('/')
            }}>
              Return to Main Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}