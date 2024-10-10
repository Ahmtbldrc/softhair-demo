"use client"

import React, { useState } from 'react'
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

// Mock data for staff and services
const staffMembers = [
  { id: 1, name: "John Doe", image: "/image/staff-1.png" },
  { id: 2, name: "Jane Smith", image: "/image/staff-2.png" },
  { id: 3, name: "Alex Johnson", image: "/image/staff-3.png" },
]

const services = [
  { id: 1, name: "Haircut", price: 50 },
  { id: 2, name: "Color", price: 100 },
  { id: 3, name: "Styling", price: 75 },
]

type Appointment = {
  id: number;
  serviceId: number;
  start: Date;
  end: Date;
  staffId: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

const initialAppointments: Appointment[] = [
  {
    id: 1,
    serviceId: 1,
    start: new Date(2024, 9, 10, 10, 0),
    end: new Date(2024, 9, 10, 11, 0),
    staffId: 1,
    customer: {
      firstName: "Alice",
      lastName: "Brown",
      email: "alice@example.com",
      phone: "123-456-7890"
    }
  },
  {
    id: 2,
    serviceId: 2,
    start: new Date(2024, 9, 10, 14, 0),
    end: new Date(2024, 9, 10, 16, 0),
    staffId: 2,
    customer: {
      firstName: "Bob",
      lastName: "Wilson",
      email: "bob@example.com",
      phone: "234-567-8901"
    }
  },
]

export default function AppointmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const filteredAppointments = selectedStaff && selectedStaff !== 'all'
    ? appointments.filter((apt) => apt.staffId === Number(selectedStaff))
    : appointments

  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7))
  }

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7))
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailsDialogOpen(true)
  }

  const handleCancelAppointment = (appointmentId: number) => {
    setAppointments(appointments.filter(apt => apt.id !== appointmentId))
    setIsDetailsDialogOpen(false)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Appointment Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button onClick={handlePrevWeek}>&lt; Previous Week</Button>
          <h2 className="text-lg font-semibold">
            {format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <Button onClick={handleNextWeek}>Next Week &gt;</Button>
        </div>
        <div className="mb-4">
          <Select onValueChange={(value) => setSelectedStaff(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staffMembers.map((staff) => (
                <SelectItem key={staff.id} value={staff.id.toString()}>
                  {staff.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <Card key={day.toString()} className="p-2">
              <CardHeader className="p-2">
                <CardTitle className="text-sm">{format(day, 'EEE')}</CardTitle>
                <p className="text-xs text-muted-foreground">{format(day, 'MMM d')}</p>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-40">
                  {filteredAppointments
                    .filter((apt) => isSameDay(apt.start, day))
                    .map((apt) => (
                      <div 
                        key={apt.id} 
                        className="text-xs mb-1 p-1 bg-primary text-primary-foreground rounded cursor-pointer"
                        onClick={() => handleAppointmentClick(apt)}
                      >
                        {format(apt.start, 'HH:mm')} - {services.find(s => s.id === apt.serviceId)?.name} - {staffMembers.find(s => s.id === apt.staffId)?.name}
                      </div>
                    ))}
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Appointment Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{services.find(s => s.id === selectedAppointment.serviceId)?.name}</CardTitle>
                    <CardDescription>
                      {format(selectedAppointment.start, 'MMMM d, yyyy')} at {format(selectedAppointment.start, 'HH:mm')} - {format(selectedAppointment.end, 'HH:mm')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar>
                        <AvatarImage src={staffMembers.find(s => s.id === selectedAppointment.staffId)?.image} />
                        <AvatarFallback>ST</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">Staff</h3>
                        <p>{staffMembers.find(s => s.id === selectedAppointment.staffId)?.name}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold">Service</h3>
                      <p>{services.find(s => s.id === selectedAppointment.serviceId)?.name}</p>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold">Price</h3>
                      <p>${services.find(s => s.id === selectedAppointment.serviceId)?.price}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Customer Information</h3>
                      <p>Name: {selectedAppointment.customer.firstName} {selectedAppointment.customer.lastName}</p>
                      <p>Email: {selectedAppointment.customer.email}</p>
                      <p>Phone: {selectedAppointment.customer.phone}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Cancel Appointment</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently cancel the appointment.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, keep appointment</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancelAppointment(selectedAppointment.id)}>
                            Yes, cancel appointment
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}