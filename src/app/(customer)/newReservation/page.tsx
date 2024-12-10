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
import { StaffType, TimeSlot } from '@/lib/types'
import { useRouter } from 'next/navigation'
import useMail from '@/hooks/use-mail'
import { useLocale } from '@/contexts/LocaleContext' // Add this import

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
  const { t } = useLocale()

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("*")
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

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("*, services:staff_services(service:service_id(id, name))")
      .eq('status', true)
    if (error) {
      console.error("Error fetching staff:", error)
      toast({
        title: "Error",
        description: t("newReservation.errors.fetchStaff"),
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

  useEffect(() => {
    fetchAppointments()
  }, [currentDate])

  useEffect(() => {
    fetchServices()
    fetchStaff()
  }, [selectedService])  

  const handlePrevWeek = () => {
    const prevWeekStart = addDays(currentDate, -7)
    if (prevWeekStart >= startOfWeek(new Date())) {
      setCurrentDate(prevWeekStart)
    }
  }

  const handleNextWeek = () => {
    const nextWeekStart = addDays(currentDate, 7)
    if (nextWeekStart <= addDays(new Date(), 14)) {
      setCurrentDate(nextWeekStart)
    }
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
    const now = new Date()
    const twoWeeksFromNow = addDays(now, 14)

    workingHours.forEach(slot => {
      let currentTime = parse(slot.start, 'HH:mm', day)
      const endTime = parse(slot.end, 'HH:mm', day)

      while (currentTime <= subMinutes(endTime, 60)) {
        //const slotEndTime = addMinutes(currentTime, 60)
        
        const hasConflict = existingAppointments.some((apt) =>
          apt.staffId === selectedStaff &&
          isSameDay(apt.start, day) &&
          format(currentTime, "HH:mm") === format(new Date(apt.start), "HH:mm")
        )

        const isPastDateTime = currentTime < now
        const isFutureDateTime = currentTime > twoWeeksFromNow

        availableTimes.push({
          time: new Date(currentTime),
          available: !hasConflict && !isPastDateTime && !isFutureDateTime
        })

        currentTime = addMinutes(currentTime, 60)
      }
    })

    return availableTimes
  }

  const handleReservation = async () => {
    if (!selectedService || !selectedStaff || !selectedTime) {
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
        description: t("newReservation.errors.createReservation"),
        variant: "destructive",
      })
    } else {
      setIsSuccessDialogOpen(true)
    }

   // <p>Hi ${customerInfo.firstName},</p>
   //   <p>Your appointment has been successfully booked for ${format(selectedTime, 'MMMM d, yyyy HH:mm')}.</p>
   // <p>Service: ${service.name}</p>
   // <p>Staff: ${staff.find(s => s.id === selectedStaff)?.firstName} ${staff.find(s => s.id === selectedStaff)?.lastName}</p>
   // <p>Price: ${service.price} CHF</p>
   // <p>Duration: ${service.duration} minutes</p>
   // <p>Email:
   //<a href="mailto:${staff.find(s => s.id === selectedStaff)?.email}">
   //${staff.find(s => s.id === selectedStaff)?.email}
   //</a>
   //</p>

    mail.sendMail({
      to: customerInfo.email,
      subject: `${customerInfo.firstName} Appointment Confirmation`,
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
<p style="margin: 0; word-break: break-word;"><strong>Staff E-mail:  ${staff.find(s => s.id === selectedStaff)?.email}</strong></p>
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
</table><!-- End -->
</body>
</html>
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
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <Card className="w-full max-w-[90%] md:max-w-[60%]">
        <CardHeader>
          <CardTitle>{t("newReservation.title")}</CardTitle>
          <CardDescription>{t("newReservation.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
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
              <Label htmlFor="service">{t("newReservation.selectService")}</Label>
              <Select 
                onValueChange={(value) => {
                  setSelectedService(Number(value))
                  setSelectedStaff(null)
                  setSelectedTime(null)
                }}
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder={t("newReservation.chooseService")} />
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
            {selectedService && (
              <div>
                <Label>{t("newReservation.selectStaff")}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
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
          {selectedService && selectedStaff && (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <Button onClick={handlePrevWeek} className="mb-2 sm:mb-0">
                  &lt; {t("newReservation.previousWeek")}
                </Button>
                <h2 className="text-lg font-semibold text-center">
                  {format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
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
                            const isFutureDateTime = time > addDays(new Date(), 14)
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
                                      : 'bg-red-100 cursor-not-allowed'
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
        </CardContent>
        <CardFooter>
          <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" disabled={!selectedTime || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone}>
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
                <p><strong>{t("newReservation.staff")}:</strong> {staff.find(s => s.id === selectedStaff)?.firstName} {staff.find(s => s.id === selectedStaff)?.lastName}</p>
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
    </div>
  )
}