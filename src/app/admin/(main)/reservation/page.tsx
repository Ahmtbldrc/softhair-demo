'use client'

import React, { useEffect, useState } from 'react'
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, compareAsc, addMinutes, parse, subMinutes } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import useMail from '@/hooks/use-mail'
import { useLocale } from '@/contexts/LocaleContext'
import { Reservation, Service, Staff } from '@/lib/types'


export default function AppointmentCalendar() {
  const {t} = useLocale();
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isNewReservationDialogOpen, setIsNewReservationDialogOpen] = useState(false)
  const [newReservation, setNewReservation] = useState({
    serviceId: null as number | null,
    staffId: null as number | null,
    start: null as Date | null,
    customer: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    }
  })
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const mail = useMail()

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
    const { data, error } = await supabase
      .from("staff")
      .select("*, services:staff_services(service:service_id(id, name))")
    if (error) {
      console.error('Error fetching staff:', error)
      toast({ title: 'Error', description: 'Failed to fetch staff members.', variant: 'destructive' })
    } else {
      setStaffMembers(data as Staff[])
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
    const reservation = reservations.find(res => res.id === reservationId);
    
    if (!reservation) {
      toast({ 
        title: 'Error', 
        description: 'Reservation not found.', 
        variant: 'destructive' 
      });
      return;
    }

    if (reservation.start < new Date()) {
      toast({ 
        title: 'Error', 
        description: 'Cannot cancel past reservations.', 
        variant: 'destructive' 
      });
      return;
    }

    const error = await deleteReservation(reservationId);
    
    if (error) {
      console.error('Error cancelling reservation:', error)
      toast({ 
        title: 'Error', 
        description: 'Failed to cancel reservation.', 
        variant: 'destructive' 
      })
    } else {
      toast({ title: 'Success', description: 'Reservation cancelled successfully.' })
      setReservations(prev => prev.filter(res => res.id !== reservationId))
      setIsDetailsDialogOpen(false);

      const cancelledReservation = reservations.find(
        (res) => res.id === reservationId
      );

      if (cancelledReservation) {
        const service = services.find(
          (s) => s.id === cancelledReservation.serviceId
        );
        const staffMember = staffMembers.find(
          (s) => s.id === cancelledReservation.staffId
        );

        // Send email to customer
        mail.sendMail({
          to: cancelledReservation.customer.email,
          subject: `${cancelledReservation.customer.firstName} ${cancelledReservation.customer.lastName} your appointment has been canceled`,
          html: `
            <!DOCTYPE html>

<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<title></title>
<meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!--><!--<![endif]-->
<style>
		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			padding: 0;
		}

		a[x-apple-data-detectors] {
			color: inherit !important;
			text-decoration: inherit !important;
		}

		#MessageViewBody a {
			color: inherit;
			text-decoration: none;
		}

		p {
			line-height: inherit
		}

		.desktop_hide,
		.desktop_hide table {
			mso-hide: all;
			display: none;
			max-height: 0px;
			overflow: hidden;
		}

		.image_block img+div {
			display: none;
		}

		sup,
		sub {
			font-size: 75%;
			line-height: 0;
		}

		@media (max-width:620px) {
			.social_block.desktop_hide .social-table {
				display: inline-block !important;
			}

			.mobile_hide {
				display: none;
			}

			.row-content {
				width: 100% !important;
			}

			.stack .column {
				width: 100%;
				display: block;
			}

			.mobile_hide {
				min-height: 0;
				max-height: 0;
				max-width: 0;
				overflow: hidden;
				font-size: 0px;
			}

			.desktop_hide,
			.desktop_hide table {
				display: table !important;
				max-height: none !important;
			}
		}
	</style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
</head>
<body class="body" style="margin: 0; background-color: #091548; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #091548;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #091548; background-image: url('https://cdn.softsidedigital.com/uploads/softside/images/background_2.png'); background-position: center top; background-repeat: repeat;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-left: 10px; padding-right: 10px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
<div align="center" class="alignment" style="line-height:10px">
<div style="max-width: 203px;"><img alt="Main Image" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/cancel-calendar.png" style="display: block; height: auto; border: 0; width: 100%;" title="Main Image" width="203"/></div>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad" style="padding-bottom:15px;padding-top:10px;">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:30px;line-height:120%;text-align:center;mso-line-height-alt:36px;">
<p style="margin: 0; word-break: break-word;">Ihr Termin wurde abgesagt</p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:14px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:21px;">
<p style="margin: 0; word-break: break-word;">${format(cancelledReservation.start, "MMMM d, yyyy HH:mm")}</p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:16px;font-weight:700;line-height:150%;text-align:center;mso-line-height-alt:24px;">
<p style="margin: 0; word-break: break-word;"><strong>Service & Preis: ${service?.name} ${service?.price} CHF</strong></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:15px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:22.5px;">
<p style="margin: 0; word-break: break-word;"><strong>Staff: ${staffMember?.firstName} ${staffMember?.lastName}</strong></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="15" cellspacing="0" class="button_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad">
<div align="center" class="alignment"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com/" style="height:36px;width:179px;v-text-anchor:middle;" arcsize="64%" stroke="false" fillcolor="#ffffff">
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#091548;font-family:'Trebuchet MS', sans-serif;font-size:13px">
<![endif]--><a href="http://www.example.com/" style="background-color:#ffffff;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:23px;border-right:0px solid transparent;border-top:0px solid transparent;color:#091548;display:inline-block;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:13px;font-weight:undefined;mso-border-alt:none;padding-bottom:5px;padding-top:5px;text-align:center;text-decoration:none;width:auto;word-break:keep-all;" target="_blank"><span style="word-break: break-word; padding-left: 25px; padding-right: 25px; font-size: 13px; display: inline-block; letter-spacing: normal;"><span style="word-break: break-word; line-height: 26px;">Neuen Termin anlegen</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
</td>
</tr>
</table>
<table border="0" cellpadding="0" cellspacing="0" class="divider_block block-7" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="padding-bottom:15px;padding-left:10px;padding-right:10px;padding-top:10px;">
<div align="center" class="alignment">
<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="60%">
<tr>
<td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #5A6BA8;"><span style="word-break: break-word;"> </span></td>
</tr>
</table>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-8" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:14px;font-weight:700;line-height:150%;text-align:center;mso-line-height-alt:21px;">
<p style="margin: 0; word-break: break-word;"><strong>Vielen Dank, dass Sie sich für uns entschieden haben</strong></p>
</div>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="padding-bottom:5px;padding-right:30px;padding-top:15px;width:100%;padding-left:0px;">
<div align="center" class="alignment" style="line-height:10px">
<div style="max-width: 210px;"><img alt="Your Logo" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/Logo-2007.png" style="display: block; height: auto; border: 0; width: 100%;" title="Your Logo" width="210"/></div>
</div>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-left: 10px; padding-right: 10px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="0" cellspacing="0" class="divider_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="padding-bottom:15px;padding-left:10px;padding-right:10px;padding-top:15px;">
<div align="center" class="alignment">
<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="60%">
<tr>
<td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #5A6BA8;"><span style="word-break: break-word;"> </span></td>
</tr>
</table>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="10" cellspacing="0" class="social_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad">
<div align="center" class="alignment">
<table border="0" cellpadding="0" cellspacing="0" class="social-table" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block;" width="156px">
<tr>
<td style="padding:0 10px 0 10px;"><a href="https://www.facebook.com" target="_blank"><img alt="Facebook" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/facebook2x.png" style="display: block; height: auto; border: 0;" title="Facebook" width="32"/></a></td>
<td style="padding:0 10px 0 10px;"><a href="https://www.instagram.com" target="_blank"><img alt="Instagram" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/instagram2x.png" style="display: block; height: auto; border: 0;" title="Instagram" width="32"/></a></td>
<td style="padding:0 10px 0 10px;"><a href="https://www.twitter.com" target="_blank"><img alt="Twitter" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/twitter2x.png" style="display: block; height: auto; border: 0;" title="Twitter" width="32"/></a></td>
</tr>
</table>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="15" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#4a60bb;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:12px;line-height:120%;text-align:center;mso-line-height-alt:14.399999999999999px;">
<p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Copyright © 2024 <a href="https://softsidedigital.com" rel="noopener" style="text-decoration: underline; color: #7f96ef;" target="_blank">Softside Digital</a>, All rights reserved.<br/></span></p>
<p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;"><br/>Changed your mind? You can <a href="http://www.example.com" rel="noopener" style="text-decoration: underline; color: #7f96ef;" target="_blank" title="unsubscribe">unsubscribe</a> at any time.</span></p>
</div>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table><!-- End -->
</body>
</html>
          `,
        });

      }

    }
  }

  const isStaffWorkingOnDay = (staffId: number, day: Date) => {
    const staffMember = staffMembers.find(s => s.id === staffId)
    if (!staffMember) return false
    const dayName = format(day, 'EEE').toUpperCase()
    return staffMember.weeklyHours && staffMember.weeklyHours[dayName] && staffMember.weeklyHours[dayName].length > 0
  }

  const getStaffWorkingHours = (staffId: number, day: Date) => {
    const staffMember = staffMembers.find(s => s.id === staffId)
    if (!staffMember || !staffMember.weeklyHours) return null
    const dayName = format(day, 'EEE').toUpperCase()
    return staffMember.weeklyHours[dayName] || null
  }

  const getAvailableTimesForDay = (day: Date) => {
    if (!newReservation.serviceId || !newReservation.staffId) return []

    const workingHours = getStaffWorkingHours(newReservation.staffId, day)
    if (!workingHours || workingHours.length === 0) return []

    const availableTimes: { time: Date; available: boolean }[] = []
    const now = new Date()
    const twoWeeksFromNow = addDays(now, 14)

    workingHours.forEach(slot => {
      let currentTime = parse(slot.start, 'HH:mm', day)
      const endTime = parse(slot.end, 'HH:mm', day)

      // Saatlik slotlar oluştur
      while (currentTime <= subMinutes(endTime, 60)) {
        
        // Sadece tam olarak bu slot saatinde rezervasyon var mı kontrol et
        const hasConflict = reservations.some((res) =>
          res.staffId === newReservation.staffId &&
          isSameDay(res.start, day) &&
          format(currentTime, "HH:mm") === format(new Date(res.start), "HH:mm")
        )

        // Geçmiş tarih/saat ve gelecek tarih kontrolü
        const isPastDateTime = currentTime < now
        const isFutureDateTime = currentTime > twoWeeksFromNow

        availableTimes.push({
          time: new Date(currentTime),
          available: !hasConflict && !isPastDateTime && !isFutureDateTime
        })

        // Bir sonraki saate geç
        currentTime = addMinutes(currentTime, 60)
      }
    })

    return availableTimes
  }

  const handleNewReservation = async () => {
    if (!newReservation.serviceId || !newReservation.staffId || !newReservation.start) {
      toast({
        title: "Error",
        description: "Please select a service, staff, and time.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const service = services.find(s => s.id === newReservation.serviceId)
    if (!service) {
      toast({
        title: "Error",
        description: "Selected service not found.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Bitiş zamanını 59 dakika sonrası olarak ayarla
    const endTime = addMinutes(newReservation.start, 59)

    const newReservationData = {
      serviceId: newReservation.serviceId,
      staffId: newReservation.staffId,
      start: newReservation.start,
      end: endTime,
      customer: {
        firstName: newReservation.customer.firstName,
        lastName: newReservation.customer.lastName,
        email: newReservation.customer.email,
        phone: newReservation.customer.phone,
      },
      status: true
    }

    const { error } = await supabase
      .from('reservations')
      .insert([newReservationData])

    if (error) {
      console.error("Error creating reservation:", error)
      toast({
        title: "Error",
        description: "Failed to create reservation. Please try again.",
        variant: "destructive",
      })
    } else {
      setIsSuccessDialogOpen(true)
      fetchReservations()
    }

    const staffMember = staffMembers.find(s => s.id === newReservation.staffId)

    mail.sendMail({
      to: newReservation.customer.email,
      subject: `${newReservation.customer.firstName} Appointment Confirmation`,
      html: `
       <!DOCTYPE html>

<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<title></title>
<meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!--><!--<![endif]-->
<style>
		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			padding: 0;
		}

		a[x-apple-data-detectors] {
			color: inherit !important;
			text-decoration: inherit !important;
		}

		#MessageViewBody a {
			color: inherit;
			text-decoration: none;
		}

		p {
			line-height: inherit
		}

		.desktop_hide,
		.desktop_hide table {
			mso-hide: all;
			display: none;
			max-height: 0px;
			overflow: hidden;
		}

		.image_block img+div {
			display: none;
		}

		sup,
		sub {
			font-size: 75%;
			line-height: 0;
		}

		@media (max-width:620px) {
			.social_block.desktop_hide .social-table {
				display: inline-block !important;
			}

			.mobile_hide {
				display: none;
			}

			.row-content {
				width: 100% !important;
			}

			.stack .column {
				width: 100%;
				display: block;
			}

			.mobile_hide {
				min-height: 0;
				max-height: 0;
				max-width: 0;
				overflow: hidden;
				font-size: 0px;
			}

			.desktop_hide,
			.desktop_hide table {
				display: table !important;
				max-height: none !important;
			}
		}
	</style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
</head>
<body class="body" style="margin: 0; background-color: #091548; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #091548;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #091548; background-image: url('https://cdn.softsidedigital.com/uploads/softside/images/background_2.png'); background-position: center top; background-repeat: repeat;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-left: 10px; padding-right: 10px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
<div align="center" class="alignment" style="line-height:10px">
<div style="max-width: 203px;"><img alt="Main Image" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/calendar.png" style="display: block; height: auto; border: 0; width: 100%;" title="Main Image" width="203"/></div>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad" style="padding-bottom:15px;padding-top:10px;">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:30px;line-height:120%;text-align:center;mso-line-height-alt:36px;">
<p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Ihr Termin wurde erstellt</span></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:14px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:21px;">
<p style="margin: 0; word-break: break-word;">${format(newReservation.start, 'MMMM d, yyyy HH:mm')}</p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:16px;font-weight:700;line-height:150%;text-align:center;mso-line-height-alt:24px;">
<p style="margin: 0; word-break: break-word;"><strong>Service & Price: ${service.name} ${service.price} CHF</strong></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:15px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:22.5px;">
<p style="margin: 0; word-break: break-word;"><strong>Staff: ${staffMember?.firstName} ${staffMember?.lastName}</strong></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="15" cellspacing="0" class="button_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad">
<div align="center" class="alignment"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com/" style="height:36px;width:218px;v-text-anchor:middle;" arcsize="64%" stroke="false" fillcolor="#ffffff">
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#091548;font-family:'Trebuchet MS', sans-serif;font-size:13px">
<![endif]--><a href="http://www.example.com/" style="background-color:#ffffff;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:23px;border-right:0px solid transparent;border-top:0px solid transparent;color:#091548;display:inline-block;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:13px;font-weight:undefined;mso-border-alt:none;padding-bottom:5px;padding-top:5px;text-align:center;text-decoration:none;width:auto;word-break:keep-all;" target="_blank"><span style="word-break: break-word; padding-left: 25px; padding-right: 25px; font-size: 13px; display: inline-block; letter-spacing: normal;"><span style="word-break: break-word;"><span data-mce-style="" style="word-break: break-word; line-height: 26px;"><strong>Stornieren Sie Ihren Termin</strong></span></span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
</td>
</tr>
</table>
<table border="0" cellpadding="0" cellspacing="0" class="divider_block block-7" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="padding-bottom:15px;padding-left:10px;padding-right:10px;padding-top:10px;">
<div align="center" class="alignment">
<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="60%">
<tr>
<td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #5A6BA8;"><span style="word-break: break-word;"> </span></td>
</tr>
</table>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-8" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:14px;font-weight:700;line-height:150%;text-align:center;mso-line-height-alt:21px;">
<p style="margin: 0; word-break: break-word;"><strong>Vielen Dank, dass Sie sich für uns entschieden haben</strong></p>
</div>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="padding-bottom:5px;padding-right:30px;padding-top:15px;width:100%;padding-left:0px;">
<div align="center" class="alignment" style="line-height:10px">
<div style="max-width: 210px;"><img alt="Your Logo" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/Logo-2007.png" style="display: block; height: auto; border: 0; width: 100%;" title="Your Logo" width="210"/></div>
</div>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-left: 10px; padding-right: 10px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="0" cellspacing="0" class="divider_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="padding-bottom:15px;padding-left:10px;padding-right:10px;padding-top:15px;">
<div align="center" class="alignment">
<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="60%">
<tr>
<td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #5A6BA8;"><span style="word-break: break-word;"> </span></td>
</tr>
</table>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="10" cellspacing="0" class="social_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad">
<div align="center" class="alignment">
<table border="0" cellpadding="0" cellspacing="0" class="social-table" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block;" width="156px">
<tr>
<td style="padding:0 10px 0 10px;"><a href="https://www.facebook.com" target="_blank"><img alt="Facebook" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/facebook2x.png" style="display: block; height: auto; border: 0;" title="Facebook" width="32"/></a></td>
<td style="padding:0 10px 0 10px;"><a href="https://www.instagram.com" target="_blank"><img alt="Instagram" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/instagram2x.png" style="display: block; height: auto; border: 0;" title="Instagram" width="32"/></a></td>
<td style="padding:0 10px 0 10px;"><a href="https://www.twitter.com" target="_blank"><img alt="Twitter" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/twitter2x.png" style="display: block; height: auto; border: 0;" title="Twitter" width="32"/></a></td>
</tr>
</table>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="15" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#4a60bb;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:12px;line-height:120%;text-align:center;mso-line-height-alt:14.399999999999999px;">
<p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Copyright © 2024 <a href="https://softsidedigital.com" rel="noopener" style="text-decoration: underline; color: #7f96ef;" target="_blank">Softside Digital</a>, All rights reserved.<br/></span></p>
<p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;"><br/>Changed your mind? You can <a href="http://www.example.com" rel="noopener" style="text-decoration: underline; color: #7f96ef;" target="_blank" title="unsubscribe">unsubscribe</a> at any time.</span></p>
</div>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table><!-- End -->
</body>
</html>
        `
    })
    setIsSubmitting(false)
    setIsConfirmDialogOpen(false)
  }

  const resetForm = () => {
    setNewReservation({
      serviceId: null,
      staffId: null,
      start: null,
      customer: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      }
    })
    setCurrentDate(new Date())
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('admin-reservation.reservationCalendar')}</CardTitle>
          <CardDescription>{t('admin-reservation.reservationCalendarDescription')}</CardDescription>
        </div>
        <Dialog open={isNewReservationDialogOpen} onOpenChange={setIsNewReservationDialogOpen}>
          <DialogTrigger asChild>
            <Button>{t('admin-reservation.newReservation')}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{t('admin-reservation.newReservation')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('admin-reservation.customerInformation')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t('admin-reservation.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={newReservation.customer.firstName}
                      onChange={(e) => setNewReservation({...newReservation, customer: {...newReservation.customer, firstName: e.target.value}})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t('admin-reservation.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={newReservation.customer.lastName}
                      onChange={(e) => setNewReservation({...newReservation, customer: {...newReservation.customer, lastName: e.target.value}})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t('admin-reservation.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newReservation.customer.email}
                      onChange={(e) => setNewReservation({...newReservation, customer: {...newReservation.customer, email: e.target.value}})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t('admin-reservation.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newReservation.customer.phone}
                      onChange={(e) => setNewReservation({...newReservation, customer: {...newReservation.customer, phone: e.target.value}})}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="service">{t('admin-reservation.selectService')}</Label>
                <Select 
                  onValueChange={(value) => {
                    setNewReservation({...newReservation, serviceId: Number(value), staffId: null, start: null})
                  }}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder={t('admin-reservation.selectService')} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} ({service.price} CHF)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newReservation.serviceId && (
                <div>
                  <Label>{t('admin-reservation.selectStaff')}</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
                    {staffMembers
                      .filter(staffMember => 
                        staffMember.services.some(s => s.service.id === newReservation.serviceId)
                      )
                      .map((staffMember) => (
                        <Card 
                          key={staffMember.id} 
                          className={`cursor-pointer transition-all ${newReservation.staffId === staffMember.id ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => {
                            setNewReservation({...newReservation, staffId: staffMember.id, start: null})
                          }}
                        >
                          <CardContent className="flex flex-col items-center p-4">
                            <Image
                              src={`https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staffMember.image}`}
                              alt={`${staffMember.firstName} ${staffMember.lastName}`}
                              width={100}
                              height={100}
                              className="rounded-md mb-2"
                              unoptimized
                            />
                            <p className="text-center text-sm">{`${staffMember.firstName} ${staffMember.lastName}`}</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
            {newReservation.serviceId && newReservation.staffId && (
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                  <Button onClick={handlePrevWeek} className="mb-2 sm:mb-0">&lt; {t('admin-reservation.previousWeek')}</Button>
                  <h2 className="text-lg font-semibold text-center">
                    {format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
                  </h2>
                  <Button onClick={handleNextWeek} className="mt-2 sm:mt-0">{t('admin-reservation.nextWeek')} &gt;</Button>
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
                          {newReservation.staffId && isStaffWorkingOnDay(newReservation.staffId, day) ? (
                            getAvailableTimesForDay(day).map(({ time, available }) => {
                              const isPastDateTime = time < new Date()
                              const isFutureDateTime = time > addDays(new Date(), 14)
                              return (
                                <Button
                                  key={time.toISOString()}
                                  variant="outline"
                                  className={`w-full mb-1 ${
                                    isPastDateTime || isFutureDateTime
                                      ? 'line-through text-muted-foreground hover:no-underline cursor-not-allowed'
                                      : available 
                                        ? newReservation.start &&
                                          isSameDay(newReservation.start, time) &&
                                          newReservation.start.getTime() === time.getTime()
                                          ? 'bg-green-500 text-white hover:bg-green-600'
                                          : 'hover:bg-green-100'
                                        : 'bg-red-100 cursor-not-allowed'
                                  }`}
                                  onClick={() => !isPastDateTime && !isFutureDateTime && available && setNewReservation({
                                    ...newReservation,
                                    start: time,
                                  })}
                                  disabled={isPastDateTime || isFutureDateTime || !available}
                                >
                                  {format(time, 'HH:mm')}
                                </Button>
                              )
                            })
                          ) : (
                            <p className="text-xs text-muted-foreground">{t('admin-reservation.notAvailable')}</p>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsConfirmDialogOpen(true)} disabled={!newReservation.start || !newReservation.customer.firstName || !newReservation.customer.lastName || !newReservation.customer.email || !newReservation.customer.phone}>
                {t('admin-reservation.bookAppointment')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center gap-4 mb-4">
          <Button onClick={handlePrevWeek} size="icon" variant="outline">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-center min-w-[200px]">
            <span className="hidden md:inline">{format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}</span>
            <span className="md:hidden">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}</span>
          </h2>
          <Button onClick={handleNextWeek} size="icon" variant="outline">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{t('admin-reservation.selectStaff')}</h3>
          <Select
            value={selectedStaff || ""}
            onValueChange={(value) => setSelectedStaff(value)}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder={t('admin-reservation.selectStaff')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="py-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <span className="text-base font-medium">{t('admin-reservation.allStaff')}</span>
                </div>
              </SelectItem>
              
              {/* Aktif Staff'lar */}
              {staffMembers
                .filter(staff => staff.status)
                .map((staff) => (
                  <SelectItem key={staff.id} value={staff.id.toString()} className="py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 relative overflow-hidden rounded-md flex-shrink-0">
                        <Image
                          src={`https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staff.image}`}
                          alt={`${staff.firstName} ${staff.lastName}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <span className="text-base font-medium">
                        {staff.firstName} {staff.lastName}
                      </span>
                    </div>
                  </SelectItem>
                ))}

              {/* Pasif Staff'lar için ayırıcı */}
              {staffMembers.some(staff => !staff.status) && (
                <SelectSeparator className="my-2" />
              )}

              {/* Pasif Staff'lar */}
              {staffMembers
                .filter(staff => !staff.status)
                .map((staff) => (
                  <SelectItem key={staff.id} value={staff.id.toString()} className="py-2">
                    <div className="flex items-center gap-3 opacity-50">
                      <div className="h-10 w-10 relative overflow-hidden rounded-md flex-shrink-0 grayscale">
                        <Image
                          src={`https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staff.image}`}
                          alt={`${staff.firstName} ${staff.lastName}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <span className="text-base font-medium line-through">
                        {staff.firstName} {staff.lastName}
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
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
              <DialogTitle>{t('admin-reservation.reservationDetails')}</DialogTitle>
            </DialogHeader>
            {selectedReservation && (
              <div className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{services.find(s => s.id === selectedReservation.serviceId)?.name}</CardTitle>
                    <CardDescription>
                      {format(selectedReservation.start, 'MMMM d, yyyy')} {t('admin-reservation.at')} {format(selectedReservation.start, 'HH:mm')} - {format(addMinutes(selectedReservation.end, 1), 'HH:mm')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar>
                        <AvatarImage src={staffMembers.find(s => s.id === selectedReservation.staffId)?.image} />
                        <AvatarFallback>{staffMembers.find(s => s.id === selectedReservation.staffId)?.firstName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{t('admin-reservation.staff')}</h3>
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
                      <h3 className="font-semibold">{t('admin-reservation.service')}</h3>
                      <p>{services.find(s => s.id === selectedReservation.serviceId)?.name}</p>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold">{t('admin-reservation.price')}</h3>
                      <p>{services.find(s => s.id === selectedReservation.serviceId)?.price} CHF</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{t('admin-reservation.customerInformation')}</h3>
                      <p>{t('admin-reservation.name')}: {selectedReservation.customer.firstName} {selectedReservation.customer.lastName}</p>
                      <p>{t('admin-reservation.email')}: {selectedReservation.customer.email}</p>
                      <p>{t('admin-reservation.phone')}: {selectedReservation.customer.phone}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">{t('admin-reservation.cancelReservation')}</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('admin-reservation.confirmCancellationDescription')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('admin-reservation.confirmCancellationDescription-2')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('admin-reservation.noKeepReservation')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancelReservation(selectedReservation.id)}>
                            {t('admin-reservation.yesCancelReservation')}
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

        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('admin-reservation.confirmDialogTitle')}</DialogTitle>
              <DialogDescription>{t('admin-reservation.confirmDialogDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p><strong>{t('admin-reservation.service')}:</strong> {services.find(s => s.id === newReservation.serviceId)?.name}</p>
              <p><strong>{t('admin-reservation.staff')}:</strong> {staffMembers.find(s => s.id === newReservation.staffId)?.firstName} {staffMembers.find(s => s.id === newReservation.staffId)?.lastName}</p>
              <p><strong>{t('admin-reservation.dateAndTime')}:</strong> {newReservation.start && format(newReservation.start, 'MMMM d, yyyy HH:mm')}</p>
              <p><strong>{t('admin-reservation.customer')}:</strong> {newReservation.customer.firstName} {newReservation.customer.lastName}</p>
              <p><strong>{t('admin-reservation.email')}:</strong> {newReservation.customer.email}</p>
              <p><strong>{t('admin-reservation.phone')}:</strong> {newReservation.customer.phone}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsConfirmDialogOpen(false)} variant="outline">
                {t('admin-reservation.edit')}
              </Button>
              <Button onClick={handleNewReservation} disabled={isSubmitting}>
                {isSubmitting ? t('admin-reservation.booking') : t('admin-reservation.confirmBooking')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('admin-reservation.reservationConfirmed')}</DialogTitle>
              <DialogDescription>{t('admin-reservation.reservationConfirmedDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p>{t('admin-reservation.reservationConfirmedMail')}: {newReservation.customer.email}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                setIsSuccessDialogOpen(false)
                setIsNewReservationDialogOpen(false)
                resetForm()
              }}>
                {t('admin-reservation.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}