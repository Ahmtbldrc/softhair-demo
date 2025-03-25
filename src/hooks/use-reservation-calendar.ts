import { useState, useEffect, useMemo, useCallback } from "react"
import { 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  format
} from "date-fns"
import { createReservation, deleteReservation, getReservations } from "@/lib/services/reservation.service"
import { getAllStaff } from "@/lib/services/staff.service"
import { getActiveServices } from "@/lib/services/service.service"
import { ReservationWithDetails, Service, StaffWithServices } from "@/lib/types"
import { useReservationForm, ReservationFormData } from "./use-reservation-form"
import useMail from "./use-mail"
import { getReservationConfirmationTemplate, getReservationCancellationTemplate } from "@/lib/email-templates"
import {
  filterReservationsByStaff,
  sortReservationsByDate,
  groupReservationsByTime,
  validateReservationCancellation
} from "@/lib/utils/reservation"
import { handleError, handleSuccess } from "@/lib/utils/error-handler"
import { supabase } from "@/lib/supabase"


interface ReservationParams {
  branchId: number;
  startDate: string;
  endDate: string;
  staffId?: number;
  status?: boolean;
}

export function useReservationCalendar(branchId: number, t: (key: string, params?: Record<string, string | number>) => string) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffWithServices[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isNewReservationDialogOpen, setIsNewReservationDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isMobile, setIsMobile] = useState(false)

  const form = useReservationForm()
  const mail = useMail()

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })


  const fetchDailyReservations = useCallback(async (date: Date) => {
    if (!branchId) return;
    
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    try {
      const result = await getReservations({
        branchId: Number(branchId),
        startDate: dayStart.toISOString(),
        endDate: dayEnd.toISOString(),
        status: true
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setReservations(result.data ?? [])
    } catch (error) {
      handleError(error, {
        title: t("admin-reservation.fetchReservationsError"),
        defaultMessage: t("admin-reservation.fetchReservationsErrorDescription")
      })
    }
  }, [branchId]);

  useEffect(() => {
    if (isMobile) {
      fetchDailyReservations(selectedDate);
    }
  }, [isMobile, selectedDate, fetchDailyReservations]);

  useEffect(() => {
    if (branchId) {
      fetchStaff()
      fetchServices()
      fetchReservations()
    }
  }, [currentDate, branchId])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchStaff = async () => {
    try {
      const result = await getAllStaff(Number(branchId))
      
      if (result.error) {
        throw new Error(result.error)
      }

      setStaffMembers(result.data ?? [])
    } catch (error) {
      handleError(error, {
        title: t("admin-reservation.fetchStaffError"),
        defaultMessage: t("admin-reservation.fetchStaffErrorDescription")
      })
    }
  }

  const fetchServices = async () => {
    try {
      const result = await getActiveServices(Number(branchId))
      
      if (result.error) {
        throw new Error(result.error)
      }

      setServices(result.data ?? [])
    } catch (error) {
      handleError(error, {
        title: t("admin-reservation.fetchServicesError"),
        defaultMessage: t("admin-reservation.fetchServicesErrorDescription")
      })
    }
  }

  const fetchReservations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userRole = user?.user_metadata?.role
      const staffId = user?.user_metadata?.staffId

      const params: ReservationParams = {
        branchId: Number(branchId),
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        status: true
      }

      if (userRole === 'staff' && staffId) {
        params.staffId = Number(staffId)
      }

      const result = await getReservations(params)

      if (result.error) {
        throw new Error(result.error)
      }

      // Sort reservations by start time
      const sortedReservations = result.data?.sort((a, b) => {
        const dateA = new Date(a.start ?? "")
        const dateB = new Date(b.start ?? "")
        return dateA.getTime() - dateB.getTime()
      }) ?? []

      setReservations(sortedReservations)
    } catch (error) {
      handleError(error, {
        title: t("admin-reservation.fetchReservationsError"),
        defaultMessage: t("admin-reservation.fetchReservationsErrorDescription")
      })
    }
  }

  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7))
  }

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7))
  }

  const handleReservationClick = (reservation: ReservationWithDetails) => {
    setSelectedReservation(reservation)
    setIsDetailsDialogOpen(true)
  }

  const handleCancelReservation = async (reservationId: number) => {
    const reservation = reservations.find(res => res.id === reservationId)
    const validation = validateReservationCancellation(reservation, t)
    if (!validation.isValid || !reservation) {
      handleError(new Error(validation.error?.description ?? "Unknown error"), {
        title: validation.error?.title ?? t("admin-reservation.cancelError"),
        defaultMessage: t("admin-reservation.unknownError")
      })
      return
    }

    try {
      const result = await deleteReservation(reservationId)
      
      if (result?.error) {
        throw new Error(result.error)
      }

      setReservations(prev => prev.filter(res => res.id !== reservationId))
      setIsDetailsDialogOpen(false)

      const service = services.find(s => s.id === reservation.serviceId)
      
      // Get staff member information - first try from staffMembers array
      let staffMember = staffMembers.find(s => s.id === reservation.staffId)
      
      // If staff member not found in array, fetch directly from database
      if (!staffMember && reservation.staffId) {
        try {
          const { data, error } = await supabase
            .from('staff')
            .select('id, firstName, lastName')
            .eq('id', reservation.staffId)
            .single()
          
          if (!error && data) {
            // Create a minimal staff object with just the needed fields for the email
            staffMember = {
              id: data.id,
              firstName: data.firstName,
              lastName: data.lastName
            } as StaffWithServices // Cast to any to avoid type errors since we only need these fields for the email
          }
        } catch (err) {
          console.error("Error fetching staff member:", err)
        }
      }

      //Customer Cancel Reservation Email
      if (service && staffMember && reservation.customer.email) {
        await mail.sendMail({
          to: reservation.customer.email,
          subject: "Ihre Reservation bei Royal Team Coiffeur wurde storniert - " + format(reservation.start ?? "", "dd.MM.yyyy") + " um " + format(reservation.start ?? "", "HH:mm"),
          html: getReservationCancellationTemplate(
            new Date(reservation.start ?? ""),
            service.name ?? "",
            service.price ?? 0,
            staffMember.firstName ?? "",
            staffMember.lastName ?? "",
            reservation.customer.firstName ?? ""          )
        })
      }

      handleSuccess(
        t("admin-reservation.cancelSuccess"),
        t("admin-reservation.cancelSuccessDescription")
      )
    } catch (error) {
      handleError(error, {
        title: t("admin-reservation.cancelError"),
        defaultMessage: t("admin-reservation.cancelErrorDescription")
      })
    }
  }

  const handleNewReservation = async (data: ReservationFormData) => {
    setIsSubmitting(true)

    const service = services.find(s => s.id === Number(data.serviceId))
    if (!service) {
      handleError(new Error(t("admin-reservation.serviceNotFound")), {
        title: t("admin-reservation.error"),
        defaultMessage: t("admin-reservation.serviceNotFound")
      })
      setIsSubmitting(false)
      return
    }

    try {
      const result = await createReservation({
        serviceId: Number(data.serviceId),
        staffId: Number(data.staffId),
        branchId: Number(branchId),
        start: data.start.toISOString(),
        customer: data.customer,
        status: true
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setIsSuccessDialogOpen(true)
      fetchReservations()

      // Get staff member information - first try from staffMembers array
      let staffMember = staffMembers.find(s => s.id === Number(data.staffId))
      
      // If staff member not found in array, fetch directly from database
      if (!staffMember && data.staffId) {
        try {
          const { data: staffData, error } = await supabase
            .from('staff')
            .select('id, firstName, lastName')
            .eq('id', Number(data.staffId))
            .single()
          
          if (!error && staffData) {
            // Create a minimal staff object with just the needed fields for the email
            staffMember = {
              id: staffData.id,
              firstName: staffData.firstName,
              lastName: staffData.lastName
            } as StaffWithServices // Cast to any to avoid type errors since we only need these fields for the email
          }
        } catch (err) {
          console.error("Error fetching staff member:", err)
        }
      }

      //Customer New Reservation Email
      if (data.customer.email && staffMember) {
        await mail.sendMail({
          to: data.customer.email,
          subject: "Bestätigung Ihrer Reservation bei Royal Team Coiffeur - " + format(data.start, "dd.MM.yyyy") + " um " + format(data.start, "HH:mm"),
          html: getReservationConfirmationTemplate(
            data.start,
            service.name ?? "",
            service.price ?? 0,
            staffMember?.firstName || "",
            staffMember?.lastName || "",
            data.customer.firstName || ""
            )
        })
      }
    } catch (error) {
      handleError(error, {
        title: t("admin-reservation.error"),
        defaultMessage: t("admin-reservation.createReservationError")
      })
    } finally {
      setIsSubmitting(false)
      setIsConfirmDialogOpen(false)
    }
  }

  const filteredReservations = filterReservationsByStaff(reservations, selectedStaff ? Number(selectedStaff) : null)
  const sortedReservations = sortReservationsByDate(filteredReservations)

  const memoizedDailyReservations = useMemo(() => {
    if (!isMobile) return reservations
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.start ?? "")
      return (
        reservationDate.getDate() === selectedDate.getDate() &&
        reservationDate.getMonth() === selectedDate.getMonth() &&
        reservationDate.getFullYear() === selectedDate.getFullYear()
      )
    })
  }, [reservations, selectedDate, isMobile])

  return {
    currentDate,
    weekStart,
    weekEnd,
    days,
    reservations: sortedReservations,
    staffMembers,
    services,
    selectedStaff,
    selectedReservation,
    isDetailsDialogOpen,
    isNewReservationDialogOpen,
    isConfirmDialogOpen,
    isSuccessDialogOpen,
    isSubmitting,
    form,
    setSelectedStaff,
    setIsDetailsDialogOpen,
    setIsNewReservationDialogOpen,
    setIsConfirmDialogOpen,
    setIsSuccessDialogOpen,
    handlePrevWeek,
    handleNextWeek,
    handleReservationClick,
    handleCancelReservation,
    handleNewReservation,
    groupReservationsByTime,
    selectedDate,
    setSelectedDate,
    isMobile,
    dailyReservations: memoizedDailyReservations,
  }
} 