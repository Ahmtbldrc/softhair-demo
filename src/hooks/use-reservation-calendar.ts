import { useState, useEffect } from "react"
import { 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval
} from "date-fns"
import { createReservation, deleteReservation, getReservations } from "@/lib/services/reservation.service"
import { getActiveStaff } from "@/lib/services/staff.service"
import { getActiveServices } from "@/lib/services/service.service"
import { ReservationWithDetails, Service, StaffWithServices } from "@/lib/database.types"
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

  const form = useReservationForm()
  const mail = useMail()

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => {
    if (branchId) {
      fetchStaff()
      fetchServices()
      fetchReservations()
    }
  }, [currentDate, branchId])

  const fetchStaff = async () => {
    try {
      const result = await getActiveStaff(branchId)
      
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
      const result = await getActiveServices(branchId)
      
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
      const result = await getReservations({
        branchId: branchId,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
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
    console.log(validation, reservation)
    debugger
    if (!validation.isValid || !reservation) {
      console.log("test", validation)
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
      const staffMember = staffMembers.find(s => s.id === reservation.staffId)

      if (service && staffMember) {
        await mail.sendMail({
          to: reservation.customer.email,
          subject: t("admin-reservation.cancelEmailSubject", {
            firstName: reservation.customer.firstName,
            lastName: reservation.customer.lastName
          }),
          html: getReservationCancellationTemplate(
            new Date(reservation.start),
            service.name,
            service.price,
            staffMember.firstName,
            staffMember.lastName
          )
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

    const service = services.find(s => s.id === data.serviceId)
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
        serviceId: data.serviceId,
        staffId: data.staffId,
        branchId: branchId,
        start: data.start,
        end: data.start,
        customer: data.customer,
        status: true
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setIsSuccessDialogOpen(true)
      fetchReservations()

      const staffMember = staffMembers.find(s => s.id === data.staffId)

      await mail.sendMail({
        to: data.customer.email,
        subject: t("admin-reservation.confirmationEmailSubject", {
          firstName: data.customer.firstName,
          lastName: data.customer.lastName
        }),
        html: getReservationConfirmationTemplate(
          data.start,
          service.name,
          service.price,
          staffMember?.firstName || "",
          staffMember?.lastName || ""
        )
      })
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

  const filteredReservations = filterReservationsByStaff(reservations, selectedStaff)
  const sortedReservations = sortReservationsByDate(filteredReservations)

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
    groupReservationsByTime
  }
} 