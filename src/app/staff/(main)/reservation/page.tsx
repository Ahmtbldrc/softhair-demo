"use client";

import React, { useEffect, useState } from "react";
import {
  addDays,
  format,
  isSameDay,
  compareAsc,
  addMinutes,
  parse,
  subMinutes,
  startOfWeek,
} from "date-fns";
import { ReservationWithDetails } from "@/lib/types";
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
import { useLocale } from "@/contexts/LocaleContext";
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useBranch } from "@/contexts/BranchContext";
import { useReservationCalendar } from "@/hooks/use-reservation-calendar";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";

type WeeklyHours = {
  [key in 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN']: Array<{
    start: string;
    end: string;
  }>;
};

type StaffMember = {
  id: number;
  firstName: string;
  lastName: string;
  weeklyHours: WeeklyHours;
  staff_services: Array<{
    service_id: number;
  }>;
};

type ViewMode = 'calendar' | 'list';

const DailyNavigation = ({ selectedDate, setSelectedDate }: { 
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Bugünün başlangıcını al
  const threeWeeksFromNow = addDays(today, 21); // 3 hafta (21 gün) sonrasına kadar

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const isPrevDisabled = selectedDate <= today;
  const isNextDisabled = selectedDate >= threeWeeksFromNow; // 3 hafta kontrolü

  return (
    <div className="flex items-center justify-between mb-4">
      <Button 
        variant="outline" 
        onClick={handlePrevDay}
        disabled={isPrevDisabled}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="font-medium">
        {selectedDate.toLocaleDateString()}
      </div>
      <Button 
        variant="outline" 
        onClick={handleNextDay}
        disabled={isNextDisabled}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function ReservationPage() {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();
  const {
    currentDate,
    weekStart,
    weekEnd,
    days,
    reservations: calendarReservations,
    staffMembers: calendarStaffMembers,
    services: calendarServices,
    selectedReservation,
    isDetailsDialogOpen,
    isNewReservationDialogOpen,
    isConfirmDialogOpen,
    isSuccessDialogOpen,
    isSubmitting,
    setIsDetailsDialogOpen,
    setIsNewReservationDialogOpen,
    setIsConfirmDialogOpen,
    setIsSuccessDialogOpen,
    handlePrevWeek,
    handleNextWeek,
    handleReservationClick: handleCalendarReservationClick,
    handleCancelReservation: handleCalendarCancelReservation,
    handleNewReservation: handleCalendarNewReservation,
    groupReservationsByTime,
  } = useReservationCalendar(selectedBranchId, t as (key: string, params?: Record<string, string | number>) => string);

  const [user, setUser] = useState<User | null>();
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
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'list' : 'calendar';
    }
    return 'calendar';
  });
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStaffInfo, setSelectedStaffInfo] = useState<{firstName: string, lastName: string} | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user as User);
      setNewReservation((prev) => ({
        ...prev,
        staffId: session?.user.user_metadata.staffId as number | null,
      }));
    });
  }, []);

  useEffect(() => {
    const fetchStaffMember = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.staffId) {
        const staffId = session.user.user_metadata.staffId;
        console.log("Staff ID from session:", staffId);
        
        const { data, error } = await supabase
          .from('staff')
          .select(`
            *,
            weeklyHours,
            staff_services!inner (
              service_id
            )
          `)
          .eq('id', staffId)
          .single();

        if (!error && data) {
          console.log("Staff member data:", data);
          setStaffMember(data);
        } else {
          console.error("Error fetching staff member:", error);
        }
      }
    };

    fetchStaffMember();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'list' : 'calendar');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (staffMember) {
      setNewReservation(prev => ({
        ...prev,
        staffId: staffMember.id
      }));
      console.log("Updated newReservation.staffId from staffMember:", staffMember.id);
    }
  }, [staffMember]);

  // Fetch staff info when a reservation is selected
  useEffect(() => {
    if (selectedReservation && selectedReservation.staffId) {
      fetchStaffInfoForReservation(selectedReservation.staffId);
    }
  }, [selectedReservation]);

  const handleNewReservationSubmit = async () => {
    if (!newReservation.serviceId || !newReservation.staffId || !newReservation.start) {
      toast({
        title: "Error",
        description: "Please select a service and time.",
        variant: "destructive",
      });
      return;
    }

    console.log("Submitting reservation with staffId:", newReservation.staffId);
    console.log("Current staffMember:", staffMember);
    console.log("Available staff members:", calendarStaffMembers);

    await handleCalendarNewReservation({
      serviceId: newReservation.serviceId,
      staffId: newReservation.staffId,
      start: newReservation.start,
      customer: newReservation.customer
    });

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
  };

  const sortedReservations = calendarReservations.sort((a, b) =>
    compareAsc(new Date(a.start ?? ""), new Date(b.start ?? ""))
  );

  const isStaffWorkingOnDay = (staffId: number, day: Date) => {
    if (!staffMember) return false;
    const dayName = format(day, "EEE").toUpperCase() as keyof WeeklyHours;
    return staffMember.weeklyHours && staffMember.weeklyHours[dayName]?.length > 0;
  };

  const getStaffWorkingHours = (staffId: number, day: Date) => {
    if (!staffMember || !staffMember.weeklyHours) return null;
    const dayName = format(day, "EEE").toUpperCase() as keyof WeeklyHours;
    return staffMember.weeklyHours[dayName] || null;
  };

  const getAvailableTimesForDay = (day: Date) => {
    if (!newReservation.serviceId || !newReservation.staffId) return [];

    const workingHours = getStaffWorkingHours(newReservation.staffId, day);
    if (!workingHours || workingHours.length === 0) return [];

    const availableTimes: { time: Date; available: boolean }[] = [];
    const now = new Date();
    const threeWeeksLater = new Date(now);
    threeWeeksLater.setDate(now.getDate() + 21);

    workingHours.forEach((slot) => {
      let currentTime = parse(slot.start, "HH:mm", day);
      const endTime = parse(slot.end, "HH:mm", day);

      while (currentTime <= subMinutes(endTime, 30)) {
        const hasConflict = calendarReservations.some((res) =>
          res.staffId === newReservation.staffId &&
          isSameDay(new Date(res.start ?? ""), day) &&
          format(currentTime, "HH:mm") === format(new Date(res.start ?? ""), "HH:mm")
        );

        const isPastDateTime = currentTime < now;
        const isFutureDateTime = currentTime > threeWeeksLater;

        availableTimes.push({
          time: new Date(currentTime),
          available: !hasConflict && !isPastDateTime && !isFutureDateTime
        });

        currentTime = addMinutes(currentTime, 30);
      }
    });

    return availableTimes;
  };

  // Function to fetch staff information when a reservation is selected
  const fetchStaffInfoForReservation = async (staffId: number) => {
    try {
      console.log("Fetching staff info for staffId:", staffId);
      const { data, error } = await supabase
        .from('staff')
        .select('id, firstName, lastName')
        .eq('id', staffId)
        .single();
      
      if (!error && data) {
        console.log("Found staff info:", data);
        setSelectedStaffInfo({
          firstName: data.firstName,
          lastName: data.lastName
        });
        return true;
      } else {
        console.error("Error fetching staff info:", error);
        setSelectedStaffInfo(null);
        return false;
      }
    } catch (err) {
      console.error("Exception fetching staff info:", err);
      setSelectedStaffInfo(null);
      return false;
    }
  };

  // Wrap the original handleCalendarReservationClick to also fetch staff info
  const handleReservationWithStaffInfo = (reservation: ReservationWithDetails) => {
    handleCalendarReservationClick(reservation);
    if (reservation.staffId) {
      fetchStaffInfoForReservation(reservation.staffId);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {isMobile ? (
          <div className="container mx-auto p-4 space-y-8 min-h-[calc(100vh-8rem)] flex flex-col">
            <DailyNavigation 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
            <div className="flex-1 flex flex-col">
              {sortedReservations
                .filter(res => isSameDay(new Date(res.start ?? ""), selectedDate))
                .length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-2" />
                  <p>{t("staff-reservation.noAppointments")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedReservations
                    .filter(res => isSameDay(new Date(res.start ?? ""), selectedDate))
                    .map((reservation) => {
                      const service = calendarServices.find(
                        (s) => s.id === reservation.serviceId
                      );
                      return (
                        <Card
                          key={reservation.id}
                          className="cursor-pointer"
                          onClick={() => handleReservationWithStaffInfo(reservation)}
                        >
                          <CardHeader className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">
                                  {format(new Date(reservation.start ?? ""), "HH:mm")}
                                </CardTitle>
                                <CardDescription>
                                  {service?.name}
                                </CardDescription>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {calendarStaffMembers.find(s => s.id === reservation.staffId)?.firstName}{" "}
                                  {calendarStaffMembers.find(s => s.id === reservation.staffId)?.lastName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {reservation.customer.firstName} {reservation.customer.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {service?.price} €
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })
                  }
                </div>
              )}
            </div>
          </div>
        ) : (
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("staff-reservation.myReservations")}</CardTitle>
                <CardDescription>
                  {t("staff-reservation.welcome")} {user?.user_metadata?.fullName as string}
                </CardDescription>
              </div>
              {!isMobile && (
                <Dialog
                  open={isNewReservationDialogOpen}
                  onOpenChange={setIsNewReservationDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      {t("staff-reservation.newReservation")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-auto overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t("staff-reservation.newReservation")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col space-y-6 overflow-y-auto">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t("staff-reservation.customerInformation")}</h3>
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
                            <Label htmlFor="phone">{t("staff-reservation.phone")}</Label>
                            <PhoneInput
                              country={'ch'}
                              value={newReservation.customer.phone}
                              onChange={(phone) => setNewReservation({
                                ...newReservation, 
                                customer: {
                                  ...newReservation.customer, 
                                  phone: phone
                                }
                              })}
                              inputClass="!w-full !h-10 !text-base !border-input !bg-background !text-foreground"
                              containerClass="!w-full"
                              buttonClass="!h-10 !border-input !bg-background"
                              dropdownClass="!bg-popover !text-foreground"
                              searchClass="!bg-background !text-foreground"
                              enableSearch={true}
                              inputProps={{
                                id: 'phone',
                                required: true,
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
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="service">{t("staff-reservation.selectService")}</Label>
                        <Select
                          onValueChange={(value) => {
                            setNewReservation({
                              ...newReservation,
                              serviceId: Number(value),
                              start: null,
                              staffId: newReservation.staffId
                            });
                          }}
                        >
                          <SelectTrigger id="service">
                            <SelectValue placeholder={t("staff-reservation.selectService")} />
                          </SelectTrigger>
                          <SelectContent>
                            {calendarServices
                              .filter(service => 
                                staffMember?.staff_services?.some(
                                  staffService => staffService.service_id === service.id
                                )
                              )
                              .map((service) => (
                                <SelectItem
                                  key={service.id}
                                  value={service.id.toString()}
                                >
                                  {service.name} ({service.price} €)
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      {newReservation.serviceId && (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                            <Button onClick={handlePrevWeek} className="mb-2 sm:mb-0">
                              &lt; {t("staff-reservation.previousWeek")}
                            </Button>
                            <h2 className="text-lg font-semibold text-center">
                              {format(weekStart, "dd.MM.yyyy")} -{" "}
                              {format(weekEnd, "dd.MM.yyyy")}
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
                                  <ScrollArea className="h-48 sm:h-40">
                                    {newReservation.staffId &&
                                    isStaffWorkingOnDay(
                                      newReservation.staffId,
                                      day
                                    ) ? (
                                      getAvailableTimesForDay(day).map(
                                        ({ time, available }) => {
                                          const isPastDateTime = time < new Date();
                                          const isFutureDateTime = time > addDays(new Date(), 21);
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
                    </div>
                    <DialogFooter className="sticky bottom-0 bg-background pt-2">
                      <Button
                        onClick={() => setIsConfirmDialogOpen(true)}
                        disabled={
                          !newReservation.start ||
                          !newReservation.customer.firstName ||
                          !newReservation.customer.lastName ||
                          !newReservation.customer.email
                        }
                      >
                        {t("staff-reservation.bookAppointment")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
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
                  {format(weekStart, "dd.MM.yyyy")} -{" "}
                  {format(weekEnd, "dd.MM.yyyy")}
                </h2>
                <Button
                  onClick={handleNextWeek}
                  disabled={startOfWeek(currentDate) >= startOfWeek(addDays(new Date(), 21))}
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
                              isSameDay(res.start ?? "", day)
                            )
                          )
                        ).map(([time, reservations]) => (
                          <div key={time} className="mb-2">
                            <p className="text-xs font-semibold">{time}</p>
                            {reservations.map((res) => (
                              <div
                                key={res.id}
                                className="text-xs mb-1 p-1 bg-primary text-primary-foreground rounded cursor-pointer"
                                onClick={() => handleReservationWithStaffInfo(res)}
                              >
                                {
                                  calendarServices.find((s) => s.id === res.serviceId)
                                    ?.name
                                }
                                <div className="text-[10px] opacity-80 mt-0.5">
                                  {calendarStaffMembers.find(s => s.id === res.staffId)?.firstName}{" "}
                                  {calendarStaffMembers.find(s => s.id === res.staffId)?.lastName}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog
          open={isDetailsDialogOpen}
          onOpenChange={(open) => {
            setIsDetailsDialogOpen(open);
            if (!open) {
              setSelectedStaffInfo(null);
            }
          }}
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
                        calendarServices.find(
                          (s) => s.id === selectedReservation.serviceId
                        )?.name
                      }
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {format(selectedReservation.start ?? "", "MMMM d, yyyy")} {t("staff-reservation.at")}{" "}
                      {format(selectedReservation.start ?? "", "HH:mm")} -{" "}
                      {format(
                        addMinutes(selectedReservation.end ?? "", 1),
                        "HH:mm"
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 py-2 text-sm">
                    <div className="flex items-center space-x-4 mb-3">
                      <div>
                        <h3 className="font-semibold">{t("staff-reservation.staff")}</h3>
                        {(() => {
                          // First try to use selectedStaffInfo if available
                          if (selectedStaffInfo) {
                            return (
                              <p>
                                {selectedStaffInfo.firstName} {selectedStaffInfo.lastName}
                              </p>
                            );
                          }
                          
                          // Then try to find staff information from calendarStaffMembers
                          const staffInfo = calendarStaffMembers.find(s => s.id === selectedReservation.staffId) || 
                                          (staffMember && staffMember.id === selectedReservation.staffId ? staffMember : null);
                          
                          if (staffInfo) {
                            return (
                              <p>
                                {staffInfo.firstName} {staffInfo.lastName}
                              </p>
                            );
                          }
                          
                          // If staff info not found, show staffId
                          return (
                            <p>
                              {t("staff-reservation.staffId")}: {selectedReservation.staffId}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="mb-3">
                      <h3 className="font-semibold">{t("staff-reservation.service")}</h3>
                      <p>
                        {
                          calendarServices.find(
                            (s) => s.id === selectedReservation.serviceId
                          )?.name
                        }
                      </p>
                    </div>
                    <div className="mb-3">
                      <h3 className="font-semibold">{t("staff-reservation.price")}</h3>
                      <p>
                        {
                          calendarServices.find(
                            (s) => s.id === selectedReservation.serviceId
                          )?.price
                        }{" "}
                        €
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
                              handleCalendarCancelReservation(
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
              {(() => {
                // Find staff information from either staffMember or calendarStaffMembers
                const staffInfo = staffMember || calendarStaffMembers.find(s => s.id === newReservation.staffId);
                
                return (
                  <>
                    <p>
                      <strong>{t("staff-reservation.service")}:</strong>{" "}
                      {
                        calendarServices.find((s) => s.id === newReservation.serviceId)
                          ?.name
                      }
                    </p>
                    <p>
                      <strong>{t("staff-reservation.staff")}:</strong>{" "}
                      {staffInfo ? `${staffInfo.firstName} ${staffInfo.lastName}` : t("staff-reservation.notSpecified")}
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
                  </>
                );
              })()}
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsConfirmDialogOpen(false)}
                variant="outline"
              >
                {t("staff-reservation.edit")}
              </Button>
              <Button
                onClick={handleNewReservationSubmit}
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
                  setIsDetailsDialogOpen(false);
                }}
              >
                {t("staff-reservation.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isMobile && (
          <Dialog open={isNewReservationDialogOpen} onOpenChange={setIsNewReservationDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="icon" 
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle>{t("staff-reservation.newReservation")}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t("staff-reservation.customerInformation")}</h3>
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
                      <Label htmlFor="phone">{t("staff-reservation.phone")}</Label>
                      <PhoneInput
                        country={'ch'}
                        value={newReservation.customer.phone}
                        onChange={(phone) => setNewReservation({
                          ...newReservation, 
                          customer: {
                            ...newReservation.customer, 
                            phone: phone
                          }
                        })}
                        inputClass="!w-full !h-10 !text-base !border-input !bg-background !text-foreground"
                        containerClass="!w-full"
                        buttonClass="!h-10 !border-input !bg-background"
                        dropdownClass="!bg-popover !text-foreground"
                        searchClass="!bg-background !text-foreground"
                        enableSearch={true}
                        inputProps={{
                          id: 'phone',
                          required: false,
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
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="service">{t("staff-reservation.selectService")}</Label>
                  <Select
                    onValueChange={(value) => {
                      setNewReservation({
                        ...newReservation,
                        serviceId: Number(value),
                        start: null,
                        staffId: newReservation.staffId
                      });
                    }}
                  >
                    <SelectTrigger id="service">
                      <SelectValue placeholder={t("staff-reservation.selectService")} />
                    </SelectTrigger>
                    <SelectContent>
                      {calendarServices
                        .filter(service => 
                          staffMember?.staff_services?.some(
                            staffService => staffService.service_id === service.id
                          )
                        )
                        .map((service) => (
                          <SelectItem
                            key={service.id}
                            value={service.id.toString()}
                          >
                            {service.name} ({service.price} €)
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                {newReservation.serviceId && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                      <Button onClick={handlePrevWeek} className="mb-2 sm:mb-0">
                        &lt; {t("staff-reservation.previousWeek")}
                      </Button>
                      <h2 className="text-lg font-semibold text-center">
                        {format(weekStart, "dd.MM.yyyy")} -{" "}
                        {format(weekEnd, "dd.MM.yyyy")}
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
                            <ScrollArea className="h-48 sm:h-40">
                              {newReservation.staffId &&
                              isStaffWorkingOnDay(
                                newReservation.staffId,
                                day
                              ) ? (
                                getAvailableTimesForDay(day).map(
                                  ({ time, available }) => {
                                    const isPastDateTime = time < new Date();
                                    const isFutureDateTime = time > addDays(new Date(), 21);
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
              </div>
              <DialogFooter className="sticky bottom-0 bg-background pt-2">
                <Button
                  onClick={() => setIsConfirmDialogOpen(true)}
                  disabled={
                    !newReservation.start ||
                    !newReservation.customer.firstName ||
                    !newReservation.customer.lastName ||
                    !newReservation.customer.email
                  }
                >
                  {t("staff-reservation.bookAppointment")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
