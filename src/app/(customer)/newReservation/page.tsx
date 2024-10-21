"use client"

import React, { useState } from 'react'
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addMinutes, isWithinInterval, parse, set } from 'date-fns'
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
import Image from 'next/image'

// Mock data for services and staff
const services = [
  { id: 1, name: "Haircut", duration: 60, price: 50, availableStaff: [1, 2, 3] },
  { id: 2, name: "Color", duration: 120, price: 100, availableStaff: [1, 2] },
  { id: 3, name: "Styling", duration: 45, price: 40, availableStaff: [2, 3] },
]

const staffMembers = [
  { 
    id: 1, 
    name: "John Doe",
    workingDays: ["MON", "TUE", "WED", "THU", "FRI"],
    workingHours: { start: "09:00", end: "17:00" },
    image: "/image/staff-1.png"
  },
  { 
    id: 2, 
    name: "Jane Smith",
    workingDays: ["TUE", "WED", "THU", "FRI", "SAT"],
    workingHours: { start: "10:00", end: "18:00" },
    image: "/image/staff-2.png"
  },
  { 
    id: 3, 
    name: "Alex Johnson",
    workingDays: ["MON", "WED", "FRI", "SAT", "SUN"],
    workingHours: { start: "08:00", end: "16:00" },
    image: "/image/staff-3.png"
  },
]

type Appointment = {
  id: number;
  serviceId: number;
  staffId: number;
  start: Date;
  end: Date;
}

// Mock existing appointments
const existingAppointments: Appointment[] = [
  { id: 1, serviceId: 1, staffId: 1, start: new Date(2024, 10, 14, 10, 0), end: new Date(2024, 10, 14, 11, 0) },
  { id: 2, serviceId: 2, staffId: 2, start: new Date(2024, 10, 14, 14, 0), end: new Date(2024, 10, 14, 16, 0) },
  { id: 3, serviceId: 3, staffId: 3, start: new Date(2024, 10, 15, 9, 0), end: new Date(2024, 10, 15, 9, 45) },
  { id: 4, serviceId: 1, staffId: 1, start: new Date(2024, 10, 16, 11, 0), end: new Date(2024, 10, 16, 12, 0) },
  { id: 5, serviceId: 2, staffId: 2, start: new Date(2024, 10, 17, 13, 0), end: new Date(2024, 10, 17, 15, 0) },
]

export default function NewReservation() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 10, 16)) 
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7))
  }

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7))
  }

  const isStaffWorkingOnDay = (staffId: number, day: Date) => {
    const staff = staffMembers.find(s => s.id === staffId)
    if (!staff) return false
    const dayName = format(day, 'EEE').toUpperCase()
    return staff.workingDays.includes(dayName)
  }

  const getStaffWorkingHours = (staffId: number) => {
    const staff = staffMembers.find(s => s.id === staffId)
    if (!staff) return null
    return {
      start: parse(staff.workingHours.start, 'HH:mm', new Date()),
      end: parse(staff.workingHours.end, 'HH:mm', new Date())
    }
  }

  const getAvailableTimesForDay = (day: Date) => {
    if (!selectedService || !selectedStaff) return []

    const service = services.find(s => s.id === selectedService)
    if (!service) return []

    if (!isStaffWorkingOnDay(selectedStaff, day)) return []

    const workingHours = getStaffWorkingHours(selectedStaff)
    if (!workingHours) return []

    const dayStart = set(day, { hours: workingHours.start.getHours(), minutes: workingHours.start.getMinutes(), seconds: 0, milliseconds: 0 })
    const dayEnd = set(day, { hours: workingHours.end.getHours(), minutes: workingHours.end.getMinutes(), seconds: 0, milliseconds: 0 })
    const availableTimes: { time: Date; available: boolean }[] = []

    let currentTime = dayStart
    while (currentTime < dayEnd) {
      const endTime = addMinutes(currentTime, service.duration)
      const isAvailable = !existingAppointments.some(apt => 
        apt.staffId === selectedStaff &&
        isSameDay(apt.start, day) &&
        (isWithinInterval(currentTime, { start: apt.start, end: apt.end }) ||
        isWithinInterval(endTime, { start: apt.start, end: apt.end }) ||
        (currentTime <= apt.start && endTime >= apt.end))
      )

      availableTimes.push({ time: new Date(currentTime), available: isAvailable })
      currentTime = addMinutes(currentTime, 30) // 30-minute intervals
    }

    return availableTimes
  }

  const handleReservation = () => {
    // Here you would typically send the reservation data to your backend
    console.log("Reservation made:", {
      service: services.find(s => s.id === selectedService)?.name,
      staff: staffMembers.find(s => s.id === selectedStaff)?.name,
      time: selectedTime,
      customerInfo
    })
    setIsConfirmDialogOpen(false)
    // Reset form or navigate to confirmation page
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
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
                  {staffMembers
                    .filter(staff => services.find(s => s.id === selectedService)?.availableStaff.includes(staff.id))
                    .map((staff) => (
                      <Card 
                        key={staff.id} 
                        className={`cursor-pointer transition-all ${selectedStaff === staff.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => {
                          setSelectedStaff(staff.id)
                          setSelectedTime(null)
                        }}
                      >
                        <CardContent className="flex flex-col items-center p-4">
                          <Image
                            src={staff.image}
                            alt={staff.name}
                            width={100}
                            height={100}
                            className="rounded-md mb-2"
                          />
                          <p className="font-semibold text-center">{staff.name}</p>
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
                <p><strong>Staff:</strong> {staffMembers.find(s => s.id === selectedStaff)?.name}</p>
                <p><strong>Date & Time:</strong> {selectedTime && format(selectedTime, 'MMMM d, yyyy HH:mm')}</p>
                <p><strong>Name:</strong> {customerInfo.firstName} {customerInfo.lastName}</p>
                <p><strong>Email:</strong> 
                 {customerInfo.email}</p>
                <p><strong>Phone:</strong> {customerInfo.phone}</p>
              </div>
              <DialogFooter>
                <Button onClick={handleReservation}>Confirm Reservation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  )
}