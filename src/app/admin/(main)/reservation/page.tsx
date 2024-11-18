'use client'

import React, { useEffect, useState } from 'react'
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, compareAsc, addMinutes } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
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
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import Image from 'next/image'
import { deleteReservation } from '@/lib/services/reservation.service'

type Staff = {
  id: number;
  firstName: string;
  lastName: string;
  image: string;
}

type Service = {
  id: number;
  name: string;
  price: number;
}

type Reservation = {
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

//deploy

export default function AppointmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => {
    fetchStaff()
    fetchServices()
    fetchReservations()

    const reservationsSubscription = supabase
      .channel('reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, payload => {
        if (payload.eventType === 'INSERT') {
          setReservations(prev => [...prev, parseReservation(payload.new as Reservation)])
        } else if (payload.eventType === 'DELETE') {
          setReservations(prev => prev.filter(res => res.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(reservationsSubscription)
    }
  }, [currentDate])

  const fetchStaff = async () => {
    const { data, error } = await supabase.from('staff').select('*')
    if (error) {
      console.error('Error fetching staff:', error)
      toast({ title: 'Error', description: 'Failed to fetch staff members.', variant: 'destructive' })
    } else {
      setStaffMembers(data)
    }
  }

  const fetchServices = async () => {
    const { data, error } = await supabase.from('services').select('*')
    if (error) {
      console.error('Error fetching services:', error)
      toast({ title: 'Error', description: 'Failed to fetch services.', variant: 'destructive' })
    } else {
      setServices(data)
    }
  }

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('status', true)
      .gte('start', weekStart.toISOString())
      .lte('start', weekEnd.toISOString())
    if (error) {
      console.error('Error fetching reservations:', error)
      toast({ title: 'Error', description: 'Failed to fetch reservations.', variant: 'destructive' })
    } else {
      setReservations(data.map(parseReservation))
    }
  }

  const parseReservation = (res: Reservation): Reservation => {
    console.log('Reservation data:', res);
    return {
      ...res,
      start: new Date(res.start),
      end: new Date(res.end),
      customer: typeof res.customer === 'string' ? JSON.parse(res.customer) : res.customer
    };
  }

  const filteredReservations = selectedStaff && selectedStaff !== 'all'
    ? reservations.filter((res) => res.staffId === Number(selectedStaff))
    : reservations

  const sortedReservations = filteredReservations.sort((a, b) => compareAsc(a.start, b.start))

  const groupReservationsByTime = (reservations: Reservation[]) => {
    const grouped: { [key: string]: Reservation[] } = {}
    reservations.forEach(res => {
      const timeKey = format(res.start, 'HH:mm')
      if (!grouped[timeKey]) {
        grouped[timeKey] = []
      }
      grouped[timeKey].push(res)
    })
    return grouped
  }

  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7))
  }

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7))
  }

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setIsDetailsDialogOpen(true)
  }

  const handleCancelReservation = async (reservationId: number) => {
    const error = await deleteReservation(reservationId);
    
    if (error) {
      console.error('Error cancelling reservation:', error)
      toast({ title: 'Error', description: 'Failed to cancel reservation.', variant: 'destructive' })
    } else {
      toast({ title: 'Success', description: 'Reservation cancelled successfully.' })
      setReservations(prev => prev.filter(res => res.id !== reservationId))
      setIsDetailsDialogOpen(false)
    }
  }

  return (
    <Card className="w-full">
    <CardHeader>
      <CardTitle>Reservation Calendar</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex justify-between items-center mb-4">
        <Button onClick={handlePrevWeek} size="icon" className="md:hidden"><ChevronLeft /></Button>
        <Button onClick={handlePrevWeek} className="hidden md:inline-flex">&lt; Previous Week</Button>
        <h2 className="text-lg font-semibold text-center">
          <span className="hidden md:inline">{format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}</span>
          <span className="md:hidden">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}</span>
        </h2>
        <Button onClick={handleNextWeek} size="icon" className="md:hidden"><ChevronRight /></Button>
        <Button onClick={handleNextWeek} className="hidden md:inline-flex">Next Week &gt;</Button>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Select Staff</h3>
        <ScrollArea className="w-full">
          <div className="flex space-x-4 pb-4 md:grid md:grid-cols-3 md:gap-4 lg:grid-cols-6">
            <Card 
              className={`flex-shrink-0 w-24 md:w-auto cursor-pointer transition-all ${selectedStaff === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedStaff('all')}
            >
              <CardContent className="flex flex-col items-center p-4">
                <Users width={60} height={60} className="rounded-md mb-2" />
                <p className="font-semibold text-center text-sm">All Staff</p>
              </CardContent>
            </Card>
            {staffMembers.map((staff) => (
              <Card 
                key={staff.id} 
                className={`flex-shrink-0 w-24 md:w-auto cursor-pointer transition-all ${selectedStaff === staff.id.toString() ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedStaff(staff.id.toString())}
              >
                <CardContent className="flex flex-col items-center p-4">
                  <Image
                    src={`https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staff.image}`}
                    alt={`${staff.firstName} ${staff.lastName}`}
                    width={60}
                    height={60}
                    className="rounded-md mb-2"
                    unoptimized
                  />
                  <p className="font-semibold text-center text-sm">{staff.firstName}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => (
          <Card key={day.toString()} className="p-2">
            <CardHeader className="p-2">
              <CardTitle className="text-sm">{format(day, 'EEE')}</CardTitle>
              <p className="text-xs text-muted-foreground">{format(day, 'MMM d')}</p>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-40 md:h-60">
                {Object.entries(groupReservationsByTime(sortedReservations.filter((res) => isSameDay(res.start, day))))
                  .map(([time, reservations]) => (
                    <div key={time} className="mb-2">
                      <p className="text-xs font-semibold">{time}</p>
                      {reservations.map((res) => (
                        <div 
                          key={res.id} 
                          className="text-xs mb-1 p-1 bg-primary text-primary-foreground rounded cursor-pointer"
                          onClick={() => handleReservationClick(res)}
                        >
                          <span className="md:hidden">{services.find(s => s.id === res.serviceId)?.name} - {staffMembers.find(s => s.id === res.staffId)?.firstName}</span>
                          <span className="hidden md:inline">{services.find(s => s.id === res.serviceId)?.name} - {staffMembers.find(s => s.id === res.staffId)?.firstName}</span>
                        </div>
                      ))}
                    </div>
                  ))}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{services.find(s => s.id === selectedReservation.serviceId)?.name}</CardTitle>
                  <CardDescription>
                    {format(selectedReservation.start, 'MMMM d, yyyy')} at {format(selectedReservation.start, 'HH:mm')} - {format(addMinutes(selectedReservation.end, 1), 'HH:mm')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar>
                      <AvatarImage src={staffMembers.find(s => s.id === selectedReservation.staffId)?.image} />
                      <AvatarFallback>{staffMembers.find(s => s.id === selectedReservation.staffId)?.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">Staff</h3>
                      <p>{staffMembers.find(s => s.id === selectedReservation.staffId)?.firstName} {staffMembers.find(s => s.id === selectedReservation.staffId)?.lastName}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-semibold">Service</h3>
                    <p>{services.find(s => s.id === selectedReservation.serviceId)?.name}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-semibold">Price</h3>
                    <p>{services.find(s => s.id === selectedReservation.serviceId)?.price} CHF</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    <p>Name: {selectedReservation.customer.firstName} {selectedReservation.customer.lastName}</p>
                    <p>Email: {selectedReservation.customer.email}</p>
                    <p>Phone: {selectedReservation.customer.phone}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">Cancel Reservation</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently cancel the reservation.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>No, keep reservation</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCancelReservation(selectedReservation.id)}>
                          Yes, cancel reservation
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