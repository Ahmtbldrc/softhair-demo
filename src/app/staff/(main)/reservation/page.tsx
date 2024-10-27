'use client'

import React, { useEffect, useState } from 'react'
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, compareAsc, addMinutes } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { User } from '@supabase/supabase-js'

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

export default function AppointmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [user, setUser] = useState<User | null>()
  
  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } } ) => {
      setUser(session?.user as User)
    })
    fetchServices()
  }, [])

  useEffect(() => {
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
  }, [currentDate, user])

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
    const { data: { session } } = await supabase.auth.getSession()

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('staffId', session?.user.user_metadata.staffId)
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
    return {
      ...res,
      start: new Date(res.start),
      end: new Date(res.end),
      customer: typeof res.customer === 'string' ? JSON.parse(res.customer) : res.customer
    };
  }

  const sortedReservations = reservations.sort((a, b) => compareAsc(a.start, b.start))

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
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId)
    
    if (error) {
      console.error('Error cancelling reservation:', error)
      toast({ title: 'Error', description: 'Failed to cancel reservation.', variant: 'destructive' })
    } else {
      toast({ title: 'Success', description: 'Reservation cancelled successfully.' })
      setReservations(prev => prev.filter(res => res.id !== reservationId))
      setIsDetailsDialogOpen(false)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>My Reservations</CardTitle>
        <CardDescription>Welcome, {user?.user_metadata?.fullName as string}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button onClick={handlePrevWeek} className="sm:w-auto sm:px-4 w-8 h-8 p-0 text-xs sm:text-sm">
            <span className="hidden sm:inline">&lt; Previous</span>
            <span className="sm:hidden">&lt;</span>
          </Button>
          <h2 className="text-sm sm:text-lg font-semibold text-center">
            {format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <Button onClick={handleNextWeek} className="sm:w-auto sm:px-4 w-8 h-8 p-0 text-xs sm:text-sm">
            <span className="hidden sm:inline">Next &gt;</span>
            <span className="sm:hidden">&gt;</span>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {days.map((day) => (
            <Card key={day.toString()} className="p-2">
              <CardHeader className="p-2">
                <CardTitle className="text-sm">{format(day, 'EEE')}</CardTitle>
                <p className="text-xs text-muted-foreground">{format(day, 'MMM d')}</p>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-32 sm:h-60">
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
                            {services.find(s => s.id === res.serviceId)?.name}
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
          <DialogContent className="sm:max-w-[425px] max-w-[90vw] rounded">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Reservation Details</DialogTitle>
            </DialogHeader>
            {selectedReservation && (
              <div className="mt-4">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base sm:text-lg">{services.find(s => s.id === selectedReservation.serviceId)?.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {format(selectedReservation.start, 'MMMM d, yyyy')} at {format(selectedReservation.start, 'HH:mm')} - {format(addMinutes(selectedReservation.end, 1), 'HH:mm')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 py-2 text-sm">
                    <div className="mb-3">
                      <h3 className="font-semibold">Service</h3>
                      <p>{services.find(s => s.id === selectedReservation.serviceId)?.name}</p>
                    </div>
                    <div className="mb-3">
                      <h3 className="font-semibold">Price</h3>
                      <p>{services.find(s => s.id === selectedReservation.serviceId)?.price} CHF</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Customer Information</h3>
                      <p>Name: {selectedReservation.customer.firstName} {selectedReservation.customer.lastName}</p>
                      <p>Email: {selectedReservation.customer.email}</p>
                      <p>Phone: {selectedReservation.customer.phone}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="px-0 pt-2 pb-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">Cancel Reservation</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] rounded">
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