"use client";

import React, { useEffect, useState } from "react";
import {
  addDays,
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  compareAsc,
  addMinutes,
  parse,
  subMinutes,
} from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { deleteReservation } from "@/lib/services/reservation.service";
import useMail from "@/hooks/use-mail";
import { useLocale } from "@/contexts/LocaleContext";

type Staff = {
  id: number;
  firstName: string;
  lastName: string;
  image: string;
  email: string;
  weeklyHours: {
    [key: string]: { start: string; end: string }[];
  };
  services: {
    service: {
      id: number;
      name: string;
    };
  }[];
};

type Service = {
  id: number;
  name: string;
  price: number;
  duration: number;
};

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
};

export default function ReservationPage() {
  const { t } = useLocale();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>();
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [isNewReservationDialogOpen, setIsNewReservationDialogOpen] =
    useState(false);
  const [newReservation, setNewReservation] = useState({
    serviceId: null as number | null,
    staffId: null as number | null,
    start: null as Date | null,
    customer: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const mail = useMail();

  const fetchAdminUsers = async () => {
    const { data, error } = await supabase.from("admin_emails").select("*");

    if (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }
    console.log(data);
    return data.map((user) => user.email);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user as User);
      setNewReservation((prev) => ({
        ...prev,
        staffId: session?.user.user_metadata.staffId as number | null,
      }));
    });
    fetchServices();
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchReservations();

    const reservationsSubscription = supabase
      .channel("reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReservations((prev) => [
              ...prev,
              parseReservation(payload.new as Reservation),
            ]);
          } else if (payload.eventType === "DELETE") {
            setReservations((prev) =>
              prev.filter((res) => res.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsSubscription);
    };
  }, [currentDate, user]);

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("*");
    if (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Error",
        description: "Failed to fetch services.",
        variant: "destructive",
      });
    } else {
      setServices(data);
    }
  };

  const fetchReservations = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("staffId", session?.user.user_metadata.staffId)
      .eq("status", true)
      .gte("start", weekStart.toISOString())
      .lte("start", weekEnd.toISOString());
    if (error) {
      console.error("Error fetching reservations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reservations.",
        variant: "destructive",
      });
    } else {
      setReservations(data.map(parseReservation));
    }
  };

  const parseReservation = (res: Reservation): Reservation => {
    return {
      ...res,
      start: new Date(res.start),
      end: new Date(res.end),
      customer:
        typeof res.customer === "string"
          ? JSON.parse(res.customer)
          : res.customer,
    };
  };

  const fetchStaff = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const staffId = session?.user.user_metadata.staffId;

    const { data, error } = await supabase
      .from("staff")
      .select("*, services:staff_services(service:service_id(id, name))")
      .eq("id", staffId)
      .single();

    if (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to fetch staff member.",
        variant: "destructive",
      });
    } else {
      setStaffMembers([data] as Staff[]);
    }
  };

  const sortedReservations = reservations.sort((a, b) =>
    compareAsc(a.start, b.start)
  );

  const groupReservationsByTime = (reservations: Reservation[]) => {
    const grouped: { [key: string]: Reservation[] } = {};
    reservations.forEach((res) => {
      const timeKey = format(res.start, "HH:mm");
      if (!grouped[timeKey]) {
        grouped[timeKey] = [];
      }
      grouped[timeKey].push(res);
    });
    return grouped;
  };

  const handlePrevWeek = () => {
    const prevWeekStart = addDays(currentDate, -7);
    if (prevWeekStart >= startOfWeek(new Date())) {
      setCurrentDate(prevWeekStart);
    }
  };

  const handleNextWeek = () => {
    const nextWeekStart = addDays(currentDate, 7);
    if (nextWeekStart <= addDays(new Date(), 14)) {
      setCurrentDate(nextWeekStart);
    }
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDetailsDialogOpen(true);
  };

  const handleCancelReservation = async (reservationId: number) => {
    const error = await deleteReservation(reservationId);

    if (error) {
      console.error("Error cancelling reservation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel reservation.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Reservation cancelled successfully.",
      });
      setReservations((prev) => prev.filter((res) => res.id !== reservationId));
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
<p style="margin: 0; word-break: break-word;"><strong>Service & Preis : ${service?.name} ${service?.price} CHF</strong></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:15px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:22.5px;">
<p style="margin: 0; word-break: break-word;"><strong>Personal : ${staffMember?.firstName} ${staffMember?.lastName}</strong></p>
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
</table><!-- End -->
</body>
</html>
          `,
        });

        // Send email to admins
        const adminEmails = await fetchAdminUsers();
        if (adminEmails.length > 0) {
          mail.sendMail({
            to: adminEmails.join(", "),
            subject: `${staffMember?.firstName} ${staffMember?.lastName} has cancelled an appointment`,
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
<div style="max-width: 203px;"><img alt="Main Image" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/x-bell.png" style="display: block; height: auto; border: 0; width: 100%;" title="Main Image" width="203"/></div>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad" style="padding-bottom:15px;padding-top:10px;">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:29px;line-height:120%;text-align:center;mso-line-height-alt:34.8px;">
<p style="margin: 0; word-break: break-word;">${staffMember?.firstName} has cancelled an appointment</p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:14px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:21px;">
<p style="margin: 0; word-break: break-word;">${format(cancelledReservation.start, 'MMMM d, yyyy HH:mm')}</p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:16px;font-weight:700;line-height:150%;text-align:center;mso-line-height-alt:24px;">
<p style="margin: 0; word-break: break-word;"><strong>Service & Preis : ${service?.name} ${service?.price} CHF</strong></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:15px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:22.5px;">
<p style="margin: 0; word-break: break-word;"><strong>Kunde : ${cancelledReservation.customer.firstName} ${cancelledReservation.customer.lastName}</strong></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:15px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:22.5px;"> </div>
</td>
</tr>
</table>
<table border="0" cellpadding="15" cellspacing="0" class="button_block block-7" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad">
<div align="center" class="alignment"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com/" style="height:38px;width:189px;v-text-anchor:middle;" arcsize="61%" stroke="false" fillcolor="#ffffff">
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#091548;font-family:'Trebuchet MS', sans-serif;font-size:14px">
<![endif]--><a href="http://www.example.com/" style="background-color:#ffffff;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:23px;border-right:0px solid transparent;border-top:0px solid transparent;color:#091548;display:inline-block;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:14px;font-weight:undefined;mso-border-alt:none;padding-bottom:5px;padding-top:5px;text-align:center;text-decoration:none;width:auto;word-break:keep-all;" target="_blank"><span style="word-break: break-word; padding-left: 25px; padding-right: 25px; font-size: 14px; display: inline-block; letter-spacing: normal;"><span style="word-break: break-word; line-height: 28px;">Neuen Termin anlegen</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
</td>
</tr>
</table>
<table border="0" cellpadding="0" cellspacing="0" class="divider_block block-8" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
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
</table><!-- End -->
</body>
</html>
            `,
          });
        }
      }
    }
  };

  const isStaffWorkingOnDay = (staffId: number, day: Date) => {
    const staffMember = staffMembers.find((s) => s.id === staffId);
    if (!staffMember) return false;
    const dayName = format(day, "EEE").toUpperCase();
    return (
      staffMember.weeklyHours &&
      staffMember.weeklyHours[dayName] &&
      staffMember.weeklyHours[dayName].length > 0
    );
  };

  const getStaffWorkingHours = (staffId: number, day: Date) => {
    const staffMember = staffMembers.find((s) => s.id === staffId);
    if (!staffMember || !staffMember.weeklyHours) return null;
    const dayName = format(day, "EEE").toUpperCase();
    return staffMember.weeklyHours[dayName] || null;
  };

  const getAvailableTimesForDay = (day: Date) => {
    if (!newReservation.serviceId || !newReservation.staffId) return [];

    const workingHours = getStaffWorkingHours(newReservation.staffId, day);
    if (!workingHours || workingHours.length === 0) return [];

    const availableTimes: { time: Date; available: boolean }[] = [];
    const now = new Date();
    const twoWeeksFromNow = addDays(now, 14);

    workingHours.forEach((slot) => {
      let currentTime = parse(slot.start, "HH:mm", day);
      const endTime = parse(slot.end, "HH:mm", day);

      // Saatlik slotlar oluştur
      while (currentTime <= subMinutes(endTime, 60)) {
        const slotEndTime = addMinutes(currentTime, 60);
        
        // Sadece tam olarak bu slot saatinde rezervasyon var mı kontrol et
        const hasConflict = reservations.some((res) =>
          res.staffId === newReservation.staffId &&
          isSameDay(res.start, day) &&
          format(currentTime, "HH:mm") === format(new Date(res.start), "HH:mm")
        );

        // Geçmiş tarih/saat ve gelecek tarih kontrolü
        const isPastDateTime = currentTime < now;
        const isFutureDateTime = currentTime > twoWeeksFromNow;

        availableTimes.push({
          time: new Date(currentTime),
          available: !hasConflict && !isPastDateTime && !isFutureDateTime
        });

        // Bir sonraki saate geç
        currentTime = addMinutes(currentTime, 60);
      }
    });

    return availableTimes;
  };

  // Güncellenen handleNewReservation fonksiyonu
  const handleNewReservation = async () => {
    if (!newReservation.serviceId || !newReservation.staffId || !newReservation.start) {
      toast({
        title: "Error",
        description: "Please select a service and time.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const service = services.find(s => s.id === newReservation.serviceId);
    if (!service) {
      toast({
        title: "Error",
        description: "Selected service not found.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Bitiş zamanını 59 dakika sonrası olarak ayarla
    const endTime = addMinutes(newReservation.start, 59);

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
      }
    };

    const { error } = await supabase
      .from('reservations')
      .insert([newReservationData]);

    if (error) {
      console.error("Error creating reservation:", error);
      toast({
        title: "Error",
        description: "Failed to create reservation. Please try again.",
        variant: "destructive",
      });
    } else {
      setIsSuccessDialogOpen(true);
      fetchReservations();

      const staffMember = staffMembers.find(s => s.id === newReservation.staffId);

      // Müşteriye e-posta gönder
      mail.sendMail({
        to: newReservation.customer.email,
        subject: 'Appointment Confirmation',
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
<p style="margin: 0; word-break: break-word;"><strong>Staff E-mail: ${staffMember?.email}</strong></p>
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
</table><!-- End -->
</body>
</html>
        `
      });

      // Admin kullanıcılara e-posta gönder
      const adminEmails = await fetchAdminUsers();
      if (adminEmails.length > 0) {
        mail.sendMail({
          to: adminEmails.join(", "),
          subject: `${staffMember?.firstName} ${staffMember?.lastName} has a new appointment`,
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
<div style="max-width: 203px;"><img alt="Main Image" height="auto" src="https://cdn.softsidedigital.com/uploads/softside/images/tick-bell.png" style="display: block; height: auto; border: 0; width: 100%;" title="Main Image" width="203"/></div>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad" style="padding-bottom:15px;padding-top:10px;">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:26px;line-height:120%;text-align:center;mso-line-height-alt:31.2px;">
<p style="margin: 0; word-break: break-word;">${staffMember?.firstName} has a new appointment</p>
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
<p style="margin: 0; word-break: break-word;"><strong>Service & Preis : ${service.name} ${service.price} CHF</strong></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:15px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:22.5px;">
<p style="margin: 0; word-break: break-word;"><strong>Kunde : ${newReservation.customer.firstName} ${newReservation.customer.lastName}</strong></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="5" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#ffffff;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:15px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:22.5px;"> </div>
</td>
</tr>
</table>
<table border="0" cellpadding="15" cellspacing="0" class="button_block block-7" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad">
<div align="center" class="alignment"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com/" style="height:38px;width:161px;v-text-anchor:middle;" arcsize="61%" stroke="false" fillcolor="#ffffff">
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#091548;font-family:'Trebuchet MS', sans-serif;font-size:14px">
<![endif]--><a href="http://www.example.com/" style="background-color:#ffffff;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:23px;border-right:0px solid transparent;border-top:0px solid transparent;color:#091548;display:inline-block;font-family:'Varela Round', 'Trebuchet MS', Helvetica, sans-serif;font-size:14px;font-weight:undefined;mso-border-alt:none;padding-bottom:5px;padding-top:5px;text-align:center;text-decoration:none;width:auto;word-break:keep-all;" target="_blank"><span style="word-break: break-word; padding-left: 25px; padding-right: 25px; font-size: 14px; display: inline-block; letter-spacing: normal;"><span style="word-break: break-word; line-height: 28px;">Termin stornieren</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
</td>
</tr>
</table>
<table border="0" cellpadding="0" cellspacing="0" class="divider_block block-8" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
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
</table><!-- End -->
</body>
</html>
          `
        });
      }
    }

    setIsSubmitting(false);
    setIsConfirmDialogOpen(false);
  };

  const resetForm = () => {
    setNewReservation({
      serviceId: null,
      staffId: user?.user_metadata?.staffId as number | null,
      start: null,
      customer: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      },
    });
    setCurrentDate(new Date());
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t("staff-reservation.myReservations")}</CardTitle>
            <CardDescription>
              {t("staff-reservation.welcome")} {user?.user_metadata?.fullName as string}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={handlePrevWeek}
                disabled={startOfWeek(currentDate) <= startOfWeek(new Date())}
                className="sm:w-auto sm:px-4 w-8 h-8 p-0 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">&lt; {t("staff-reservation.previousWeek")}</span>
                <span className="sm:hidden">&lt;</span>
              </Button>
              <h2 className="text-sm sm:text-lg font-semibold text-center">
                {format(weekStart, "MMM d, yyyy")} -{" "}
                {format(weekEnd, "MMM d, yyyy")}
              </h2>
              <Button
                onClick={handleNextWeek}
                disabled={startOfWeek(currentDate) >= startOfWeek(addDays(new Date(), 14))}
                className="sm:w-auto sm:px-4 w-8 h-8 p-0 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">{t("staff-reservation.nextWeek")} &gt;</span>
                <span className="sm:hidden">&gt;</span>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
              {days.map((day) => (
                <Card key={day.toString()} className="p-2">
                  <CardHeader className="p-2">
                    <CardTitle className="text-sm">
                      {format(day, "EEE")}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {format(day, "MMM d")}
                    </p>
                  </CardHeader>
                  <CardContent className="p-2">
                    <ScrollArea className="h-32 sm:h-60">
                      {Object.entries(
                        groupReservationsByTime(
                          sortedReservations.filter((res) =>
                            isSameDay(res.start, day)
                          )
                        )
                      ).map(([time, reservations]) => (
                        <div key={time} className="mb-2">
                          <p className="text-xs font-semibold">{time}</p>
                          {reservations.map((res) => (
                            <div
                              key={res.id}
                              className="text-xs mb-1 p-1 bg-primary text-primary-foreground rounded cursor-pointer"
                              onClick={() => handleReservationClick(res)}
                            >
                              {
                                services.find((s) => s.id === res.serviceId)
                                  ?.name
                              }
                            </div>
                          ))}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog
              open={isDetailsDialogOpen}
              onOpenChange={setIsDetailsDialogOpen}
            >
              <DialogContent className="sm:max-w-[425px] max-w-[90vw] rounded">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    {t("staff-reservation.reservationDetails")}
                  </DialogTitle>
                </DialogHeader>
                {selectedReservation && (
                  <div className="mt-4">
                    <Card className="border-0 shadow-none">
                      <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-base sm:text-lg">
                          {
                            services.find(
                              (s) => s.id === selectedReservation.serviceId
                            )?.name
                          }
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {format(selectedReservation.start, "MMMM d, yyyy")} {t("staff-reservation.at")}{" "}
                          {format(selectedReservation.start, "HH:mm")} -{" "}
                          {format(
                            addMinutes(selectedReservation.end, 1),
                            "HH:mm"
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-0 py-2 text-sm">
                        <div className="mb-3">
                          <h3 className="font-semibold">{t("staff-reservation.service")}</h3>
                          <p>
                            {
                              services.find(
                                (s) => s.id === selectedReservation.serviceId
                              )?.name
                            }
                          </p>
                        </div>
                        <div className="mb-3">
                          <h3 className="font-semibold">{t("staff-reservation.price")}</h3>
                          <p>
                            {
                              services.find(
                                (s) => s.id === selectedReservation.serviceId
                              )?.price
                            }{" "}
                            CHF
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">
                            {t("staff-reservation.customerInformation")}
                          </h3>
                          <p>
                            {t("staff-reservation.name")}: {selectedReservation.customer.firstName}{" "}
                            {selectedReservation.customer.lastName}
                          </p>
                          <p>
                            {t("staff-reservation.email")}: {selectedReservation.customer.email}
                          </p>
                          <p>
                            {t("staff-reservation.phone")}: {selectedReservation.customer.phone}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="px-0 pt-2 pb-0">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="w-full sm:w-auto"
                            >
                              {t("staff-reservation.cancelReservation")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] rounded">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("staff-reservation.confirmCancellationDescription")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("staff-reservation.confirmCancellationDescription-2")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("staff-reservation.noKeepReservation")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleCancelReservation(
                                    selectedReservation.id
                                  )
                                }
                              >
                                {t("staff-reservation.yesCancelReservation")}
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

            <Dialog
              open={isNewReservationDialogOpen}
              onOpenChange={setIsNewReservationDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="mt-4">
                  {t("staff-reservation.newReservation")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>
                    {t("staff-reservation.newReservation")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      {t("staff-reservation.customerInformation")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">
                          {t("staff-reservation.firstName")}
                        </Label>
                        <Input
                          id="firstName"
                          value={newReservation.customer.firstName}
                          onChange={(e) =>
                            setNewReservation({
                              ...newReservation,
                              customer: {
                                ...newReservation.customer,
                                firstName: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">
                          {t("staff-reservation.lastName")}
                        </Label>
                        <Input
                          id="lastName"
                          value={newReservation.customer.lastName}
                          onChange={(e) =>
                            setNewReservation({
                              ...newReservation,
                              customer: {
                                ...newReservation.customer,
                                lastName: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">
                          {t("staff-reservation.email")}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newReservation.customer.email}
                          onChange={(e) =>
                            setNewReservation({
                              ...newReservation,
                              customer: {
                                ...newReservation.customer,
                                email: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">
                          {t("staff-reservation.phone")}
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={newReservation.customer.phone}
                          onChange={(e) =>
                            setNewReservation({
                              ...newReservation,
                              customer: {
                                ...newReservation.customer,
                                phone: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="service">
                      {t("staff-reservation.selectService")}
                    </Label>
                    <Select
                      onValueChange={(value) => {
                        setNewReservation({
                          ...newReservation,
                          serviceId: Number(value),
                          start: null,
                        });
                      }}
                    >
                      <SelectTrigger id="service">
                        <SelectValue placeholder={t("staff-reservation.selectService")} />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem
                            key={service.id}
                            value={service.id.toString()}
                          >
                            {service.name} ({service.price} CHF)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {newReservation.serviceId && (
                  <div className="mt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                      <Button onClick={handlePrevWeek} className="mb-2 sm:mb-0">
                        &lt; {t("staff-reservation.previousWeek")}
                      </Button>
                      <h2 className="text-lg font-semibold text-center">
                        {format(weekStart, "MMM d, yyyy")} -{" "}
                        {format(weekEnd, "MMM d, yyyy")}
                      </h2>
                      <Button onClick={handleNextWeek} className="mt-2 sm:mt-0">
                        {t("staff-reservation.nextWeek")} &gt;
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 select-none">
                      {days.map((day) => (
                        <Card key={day.toString()} className="p-2">
                          <CardHeader className="p-2">
                            <CardTitle className="text-sm">
                              {format(day, "EEE")}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {format(day, "MMM d")}
                            </p>
                          </CardHeader>
                          <CardContent className="p-2">
                            <ScrollArea className="h-32 sm:h-40">
                              {newReservation.staffId &&
                              isStaffWorkingOnDay(
                                newReservation.staffId,
                                day
                              ) ? (
                                getAvailableTimesForDay(day).map(
                                  ({ time, available }) => {
                                    const isPastDateTime = time < new Date();
                                    const isFutureDateTime = time > addDays(new Date(), 14);
                                    return (
                                      <Button
                                        key={time.toISOString()}
                                        variant="outline"
                                        className={`w-full mb-1 ${
                                          isPastDateTime || isFutureDateTime
                                            ? 'line-through text-muted-foreground hover:no-underline cursor-not-allowed'
                                            : available 
                                              ? newReservation.start &&
                                                isSameDay(
                                                  newReservation.start,
                                                  time
                                                ) &&
                                                newReservation.start.getTime() ===
                                                  time.getTime()
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
                                    );
                                  }
                                )
                              ) : (
                                <p className="text-xs text-muted-foreground">{t("staff-reservation.notAvailable")}</p>
                              )}
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    onClick={() => setIsConfirmDialogOpen(true)}
                    disabled={
                      !newReservation.start ||
                      !newReservation.customer.firstName ||
                      !newReservation.customer.lastName ||
                      !newReservation.customer.email ||
                      !newReservation.customer.phone
                    }
                  >
                    {t("staff-reservation.bookAppointment")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isConfirmDialogOpen}
              onOpenChange={setIsConfirmDialogOpen}
            >
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {t("staff-reservation.confirmDialogTitle")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("staff-reservation.confirmDialogDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p>
                    <strong>{t("staff-reservation.service")}:</strong>{" "}
                    {
                      services.find((s) => s.id === newReservation.serviceId)
                        ?.name
                    }
                  </p>
                  <p>
                    <strong>{t("staff-reservation.staff")}:</strong>{" "}
                    {
                      staffMembers.find((s) => s.id === newReservation.staffId)
                        ?.firstName
                    }{" "}
                    {
                      staffMembers.find((s) => s.id === newReservation.staffId)
                        ?.lastName
                    }
                  </p>
                  <p>
                    <strong>{t("staff-reservation.dateAndTime")}:</strong>{" "}
                    {newReservation.start &&
                      format(newReservation.start, "MMMM d, yyyy HH:mm")}
                  </p>
                  <p>
                    <strong>{t("staff-reservation.customer")}:</strong>{" "}
                    {newReservation.customer.firstName}{" "}
                    {newReservation.customer.lastName}
                  </p>
                  <p>
                    <strong>{t("staff-reservation.email")}:</strong>{" "}
                    {newReservation.customer.email}
                  </p>
                  <p>
                    <strong>{t("staff-reservation.phone")}:</strong>{" "}
                    {newReservation.customer.phone}
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => setIsConfirmDialogOpen(false)}
                    variant="outline"
                  >
                    {t("staff-reservation.edit")}
                  </Button>
                  <Button
                    onClick={handleNewReservation}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? t("staff-reservation.booking")
                      : t("staff-reservation.confirmBooking")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isSuccessDialogOpen}
              onOpenChange={setIsSuccessDialogOpen}
            >
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {t("staff-reservation.reservationConfirmed")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("staff-reservation.reservationConfirmedDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p>
                    {t("staff-reservation.reservationConfirmedMail")}{" "}
                    {newReservation.customer.email}.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setIsSuccessDialogOpen(false);
                      setIsNewReservationDialogOpen(false);
                      resetForm();
                    }}
                  >
                    {t("staff-reservation.close")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
