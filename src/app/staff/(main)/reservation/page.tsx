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
    setCurrentDate(addDays(currentDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
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

      const adminEmails = await fetchAdminUsers();
      if (adminEmails.length > 0) {
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

          mail.sendMail({
            to: adminEmails.join(", "),
            subject: "Appointment Cancelled",
            html: `
              <p>An appointment has been cancelled:</p>
              <p>Customer: ${cancelledReservation.customer.firstName} ${
              cancelledReservation.customer.lastName
            }</p>
              <p>Service: ${service?.name}</p>
              <p>Staff: ${staffMember?.firstName} ${staffMember?.lastName}</p>
              <p>Date: ${format(
                cancelledReservation.start,
                "MMMM d, yyyy HH:mm"
              )}</p>
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

    const service = services.find((s) => s.id === newReservation.serviceId);
    if (!service) return [];

    const workingHours = getStaffWorkingHours(newReservation.staffId, day);
    if (!workingHours || workingHours.length === 0) return [];

    const availableTimes: { time: Date; available: boolean }[] = [];

    workingHours.forEach((slot) => {
      let currentTime = parse(slot.start, "HH:mm", day);
      const endTime = parse(slot.end, "HH:mm", day);

      while (currentTime < endTime) {
        const slotEndTime = addMinutes(currentTime, service.duration);
        const isAvailable = !reservations.some(
          (res) =>
            res.staffId === newReservation.staffId &&
            isSameDay(res.start, day) &&
            ((currentTime >= res.start && currentTime < res.end) ||
              (slotEndTime > res.start && slotEndTime <= res.end) ||
              (currentTime <= res.start && slotEndTime >= res.end))
        );

        availableTimes.push({
          time: new Date(currentTime),
          available: isAvailable,
        });
        currentTime = addMinutes(currentTime, service.duration); // Move to next slot based on service duration
      }
    });

    return availableTimes;
  };

  // Güncellenen handleNewReservation fonksiyonu
  const handleNewReservation = async () => {
    if (
      !newReservation.serviceId ||
      !newReservation.staffId ||
      !newReservation.start
    ) {
      toast({
        title: "Error",
        description: "Please select a service and time.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const service = services.find((s) => s.id === newReservation.serviceId);
    if (!service) {
      toast({
        title: "Error",
        description: "Selected service not found.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const endTime = addMinutes(newReservation.start, service.duration - 1);

    const newReservationData = {
      serviceId: newReservation.serviceId,
      staffId: newReservation.staffId,
      start: newReservation.start.toISOString(),
      end: endTime,
      customer: JSON.stringify(newReservation.customer),
      status: true,
    };

    const { error } = await supabase
      .from("reservations")
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

      const staffMember = staffMembers.find(
        (s) => s.id === newReservation.staffId
      );

      // Müşteriye e-posta gönder
      mail.sendMail({
        to: newReservation.customer.email,
        subject: "Appointment Confirmation",
        html: `
          <p>Hi ${newReservation.customer.firstName},</p>
          <p>Your appointment has been successfully booked for ${format(
            newReservation.start,
            "MMMM d, yyyy HH:mm"
          )}.</p>
          <p>Service: ${service.name}</p>
          <p>Staff: ${staffMember?.firstName} ${staffMember?.lastName}</p>
          <p>Price: ${service.price} CHF</p>
          <p>Duration: ${service.duration} minutes</p>
          <p>Email:
            <a href="mailto:${staffMember?.email}">
              ${staffMember?.email}
            </a>
          </p>
        `,
      });

      // Admin kullanıcılara e-posta gönder
      const adminEmails = await fetchAdminUsers();
      if (adminEmails.length > 0) {
        mail.sendMail({
          to: adminEmails.join(", "),
          subject: "New Appointment Created",
          html: `
            <p>A new appointment has been created:</p>
            <p>Customer: ${newReservation.customer.firstName} ${
            newReservation.customer.lastName
          }</p>
            <p>Service: ${service.name}</p>
            <p>Staff: ${staffMember?.firstName} ${staffMember?.lastName}</p>
            <p>Date: ${format(newReservation.start, "MMMM d, yyyy HH:mm")}</p>
          `,
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
          <h1 className="text-3xl font-bold">{t("navigation.reservation")}</h1>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>My Reservations</CardTitle>
            <CardDescription>
              Welcome, {user?.user_metadata?.fullName as string}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={handlePrevWeek}
                className="sm:w-auto sm:px-4 w-8 h-8 p-0 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">&lt; Previous</span>
                <span className="sm:hidden">&lt;</span>
              </Button>
              <h2 className="text-sm sm:text-lg font-semibold text-center">
                {format(weekStart, "MMM d, yyyy")} -{" "}
                {format(weekEnd, "MMM d, yyyy")}
              </h2>
              <Button
                onClick={handleNextWeek}
                className="sm:w-auto sm:px-4 w-8 h-8 p-0 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Next &gt;</span>
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
                    Reservation Details
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
                          {format(selectedReservation.start, "MMMM d, yyyy")} at{" "}
                          {format(selectedReservation.start, "HH:mm")} -{" "}
                          {format(
                            addMinutes(selectedReservation.end, 1),
                            "HH:mm"
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-0 py-2 text-sm">
                        <div className="mb-3">
                          <h3 className="font-semibold">Service</h3>
                          <p>
                            {
                              services.find(
                                (s) => s.id === selectedReservation.serviceId
                              )?.name
                            }
                          </p>
                        </div>
                        <div className="mb-3">
                          <h3 className="font-semibold">Price</h3>
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
                            Customer Information
                          </h3>
                          <p>
                            Name: {selectedReservation.customer.firstName}{" "}
                            {selectedReservation.customer.lastName}
                          </p>
                          <p>Email: {selectedReservation.customer.email}</p>
                          <p>Phone: {selectedReservation.customer.phone}</p>
                        </div>
                      </CardContent>
                      <CardFooter className="px-0 pt-2 pb-0">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="w-full sm:w-auto"
                            >
                              Cancel Reservation
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] rounded">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently cancel the reservation.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                No, keep reservation
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleCancelReservation(
                                    selectedReservation.id
                                  )
                                }
                              >
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

            <Dialog
              open={isNewReservationDialogOpen}
              onOpenChange={setIsNewReservationDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="mt-4">New Reservation</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>New Reservation</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
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
                        <Label htmlFor="lastName">Last Name</Label>
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
                        <Label htmlFor="email">Email</Label>
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
                        <Label htmlFor="phone">Phone</Label>
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
                    <Label htmlFor="service">Select Service</Label>
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
                        <SelectValue placeholder="Choose a service" />
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
                        &lt; Previous Week
                      </Button>
                      <h2 className="text-lg font-semibold text-center">
                        {format(weekStart, "MMM d, yyyy")} -{" "}
                        {format(weekEnd, "MMM d, yyyy")}
                      </h2>
                      <Button onClick={handleNextWeek} className="mt-2 sm:mt-0">
                        Next Week &gt;
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
                                  ({ time, available }) => (
                                    <Button
                                      key={time.toISOString()}
                                      variant="outline"
                                      className={`w-full mb-1 ${
                                        available
                                          ? newReservation.start &&
                                            isSameDay(
                                              newReservation.start,
                                              time
                                            ) &&
                                            newReservation.start.getTime() ===
                                              time.getTime()
                                            ? "bg-green-500 text-white hover:bg-green-600"
                                            : "hover:bg-green-100"
                                          : "bg-red-100 cursor-not-allowed"
                                      }`}
                                      onClick={() =>
                                        available &&
                                        setNewReservation({
                                          ...newReservation,
                                          start: time,
                                        })
                                      }
                                      disabled={!available}
                                    >
                                      {format(time, "HH:mm")}
                                    </Button>
                                  )
                                )
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Not available
                                </p>
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
                    Book Appointment
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
                  <DialogTitle>Confirm Your Reservation</DialogTitle>
                  <DialogDescription>
                    Please review your reservation details.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p>
                    <strong>Service:</strong>{" "}
                    {
                      services.find((s) => s.id === newReservation.serviceId)
                        ?.name
                    }
                  </p>
                  <p>
                    <strong>Staff:</strong>{" "}
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
                    <strong>Date & Time:</strong>{" "}
                    {newReservation.start &&
                      format(newReservation.start, "MMMM d, yyyy HH:mm")}
                  </p>
                  <p>
                    <strong>Customer:</strong>{" "}
                    {newReservation.customer.firstName}{" "}
                    {newReservation.customer.lastName}
                  </p>
                  <p>
                    <strong>Email:</strong> {newReservation.customer.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {newReservation.customer.phone}
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => setIsConfirmDialogOpen(false)}
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={handleNewReservation}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Booking..." : "Confirm Booking"}
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
                  <DialogTitle>Reservation Confirmed</DialogTitle>
                  <DialogDescription>
                    Your reservation has been successfully booked.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p>
                    An email confirmation has been sent to{" "}
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
                    Close
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
