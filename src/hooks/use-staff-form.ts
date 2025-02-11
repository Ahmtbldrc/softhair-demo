import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Service, TimeSlot, WeeklyHours } from "@/lib/database.types"
import { Roles } from "@/lib/types"
import { validateStaffForm, ValidationError } from "@/lib/utils/staff-validation"
import { handleError, handleSuccess } from "@/lib/utils/error-handler"
import { uploadStaffImage, getStaffById, getActiveServices } from "@/lib/services/staff.service"
import { supabase } from "@/lib/supabase"

interface StaffService {
  service: {
    id: number
    name: string
  }
}

export interface StaffFormState {
  id?: number
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
  userId?: string
  status: boolean
  image: string
  branchId: number
  services: number[]
  weeklyHours: WeeklyHours
  languages: string[]
}

interface UseStaffFormProps {
  branchId: number
  staffId?: string
  t: (key: string) => string
}

const defaultWeeklyHours: WeeklyHours = {
  SUN: [],
  MON: [],
  TUE: [],
  WED: [],
  THU: [],
  FRI: [],
  SAT: [],
}

const emptyStaffData: StaffFormState = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
  status: true,
  image: "",
  branchId: 0,
  services: [],
  weeklyHours: defaultWeeklyHours,
  languages: [],
}

export function useStaffForm({ branchId, staffId, t }: UseStaffFormProps) {
  const router = useRouter()

  const [staff, setStaff] = useState<StaffFormState>({
    ...emptyStaffData,
    branchId
  })
  const [services, setServices] = useState<Service[]>([])
  const [staffImageName, setStaffImageName] = useState<string>("")
  const [staffImage, setStaffImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [originalStaff, setOriginalStaff] = useState<StaffFormState | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [selectedServices, setSelectedServices] = useState<number[]>([])

  useEffect(() => {
    if (!branchId) return

    fetchServices()
    if (staffId) {
      fetchStaff()
    }
  }, [branchId, staffId])

  // Reset isSubmitting when form values change
  useEffect(() => {
    if (isSubmitting) {
      setIsSubmitting(false)
    }
  }, [
    staff.firstName,
    staff.lastName,
    staff.email,
    staff.username,
    staff.password,
    staff.status,
    staff.image,
    staff.weeklyHours,
    staff.languages,
    selectedServices
  ])

  const fetchServices = async () => {
    const result = await getActiveServices(branchId)
    if (result.error) {
      handleError(new Error(result.error), {
        title: t("admin-staff.fetchServicesError"),
        defaultMessage: t("admin-staff.fetchServicesErrorDescription")
      })
    } else {
      setServices(result.data ?? [])
    }
  }

  const fetchStaff = async () => {
    if (!staffId) return

    const result = await getStaffById(parseInt(staffId))
    if (result.error) {
      handleError(new Error(result.error), {
        title: t("admin-staff.fetchStaffError"),
        defaultMessage: t("admin-staff.fetchStaffErrorDescription")
      })
    } else if (result.data) {
      const staffData = result.data
      const formData: StaffFormState = {
        id: staffData.id,
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        username: staffData.username,
        password: staffData.password || "********",
        status: staffData.status,
        image: staffData.image || "",
        branchId: staffData.branchId,
        services: staffData.services.map((s: StaffService) => s.service.id),
        weeklyHours: staffData.weeklyHours || defaultWeeklyHours,
        userId: staffData.userId,
        languages: staffData.languages || [],
      }
      setStaff(formData)
      setOriginalStaff(formData)
      setSelectedServices(formData.services)
    }
  }

  const handleServiceChange = (serviceId: number) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleWeeklyHoursChange = (
    day: keyof WeeklyHours,
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    setStaff(prev => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: prev.weeklyHours[day].map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }

  const addTimeSlot = (day: keyof WeeklyHours) => {
    setStaff(prev => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: [...prev.weeklyHours[day], { start: "09:00", end: "17:00" }]
      }
    }))
  }

  const removeTimeSlot = (day: keyof WeeklyHours, index: number) => {
    setStaff(prev => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: prev.weeklyHours[day].filter((_, i) => i !== index)
      }
    }))
  }

  const handleUploadStaffImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const objectUrl = URL.createObjectURL(file)
      setStaffImageName(objectUrl)
      setStaffImage(file)

      const fileExtension = file.name.split(".").pop()
      const fileName = `${staff.firstName.toLowerCase()}-${staff.lastName.toLowerCase()}-${Date.now()}.${fileExtension}`
      setStaff(prev => ({ ...prev, image: fileName }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors([])

    try {
      // Prepare validation data with selected services
      const validationData = {
        ...staff,
        services: selectedServices
      }

      // Validate form
      const validationErrors = await validateStaffForm(
        validationData, 
        t,
        staffId ? parseInt(staffId) : undefined
      )

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        handleError(new Error(validationErrors[0].message), {
          title: t("admin-staff.validationError"),
          defaultMessage: validationErrors.map(error => error.message).join("\n")
        })
        setIsSubmitting(false)
        return
      }

      // Upload image if exists
      if (staffImage && staffImageName) {
        const uploadResult = await uploadStaffImage(staffImage, staff.image)
        if (uploadResult.error) {
          throw new Error(uploadResult.error)
        }
      }

      // Prepare staff data
      const staffData = validationData

      if (staffId) {
        // Update existing staff
        const { error: updateError } = await supabase
          .from("staff")
          .update({
            firstName: staffData.firstName,
            lastName: staffData.lastName,
            email: staffData.email,
            username: staffData.username,
            password: staffData.password !== "********" ? staffData.password : undefined,
            status: staffData.status,
            image: staffData.image,
            branchId: staffData.branchId,
            weeklyHours: staffData.weeklyHours,
            languages: staffData.languages || []
          })
          .eq("id", parseInt(staffId))

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Update staff services
        const { error: deleteServicesError } = await supabase
          .from("staff_services")
          .delete()
          .eq("staff_id", parseInt(staffId))

        if (deleteServicesError) {
          throw new Error(deleteServicesError.message)
        }

        const staffServices = selectedServices.map(serviceId => ({
          staff_id: parseInt(staffId),
          service_id: serviceId
        }))

        const { error: insertServicesError } = await supabase
          .from("staff_services")
          .insert(staffServices)

        if (insertServicesError) {
          throw new Error(insertServicesError.message)
        }

        // Update auth if password changed
        if (staffData.password !== "********" && staffData.userId) {
          const { data: currentUser, error: fetchError } = await supabase.auth.admin.getUserById(staffData.userId)
          
          if (fetchError) {
            throw new Error(fetchError.message)
          }

          const updatedMetadata = {
            ...currentUser.user?.user_metadata,
            fullName: `${staffData.firstName} ${staffData.lastName}`,
            username: staffData.username,
            email: staffData.email
          }

          const { error: authError } = await supabase.auth.admin.updateUserById(
            staffData.userId,
            {
              email: `${staffData.username.toLowerCase()}@softsidedigital.com`,
              password: staffData.password,
              user_metadata: updatedMetadata
            }
          )

          if (authError) {
            throw new Error(authError.message)
          }
        }

        handleSuccess(
          t("admin-staff.updateSuccess"),
          t("admin-staff.updateSuccessDescription")
        )
      } else {
        try {
          // Get current user's selected branch
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          const selectedBranchId = currentUser?.user_metadata?.selectedBranchId

          if (!selectedBranchId) {
            throw new Error("Selected branch not found")
          }

          // First create auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: `${staffData.username.toLowerCase()}@softsidedigital.com`,
            password: staffData.password,
            email_confirm: true,
            user_metadata: {
              fullName: `${staffData.firstName} ${staffData.lastName}`,
              username: staffData.username,
              email: staffData.email,
              role: Roles.STAFF,
              branchIds: [selectedBranchId],
              languages: staffData.languages,
              selectedBranchId: selectedBranchId
            }
          })

          if (authError || !authData?.user) {
            throw new Error(authError?.message || "Failed to create auth user")
          }

          // Then create staff record with the auth user's ID
          const { data: newStaff, error: createError } = await supabase
            .from("staff")
            .insert({
              firstName: staffData.firstName,
              lastName: staffData.lastName,
              email: staffData.email,
              username: staffData.username,
              password: staffData.password,
              status: staffData.status,
              image: staffData.image,
              branchId,
              weeklyHours: staffData.weeklyHours,
              userId: authData.user.id,
              languages: staffData.languages || []
            })
            .select()
            .single()

          if (createError || !newStaff) {
            throw new Error(createError?.message || "Failed to create staff")
          }

          // Update auth user with staffId
          const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
            authData.user.id,
            {
              user_metadata: {
                fullName: `${staffData.firstName} ${staffData.lastName}`,
                username: staffData.username,
                email: staffData.email,
                role: Roles.STAFF,
                staffId: newStaff.id,
                languages: staffData.languages || []
              }
            }
          )

          if (updateAuthError) {
            throw new Error(updateAuthError.message)
          }

          // Create staff services
          if (selectedServices.length > 0) {
            const staffServices = selectedServices.map(serviceId => ({
              staff_id: newStaff.id,
              service_id: serviceId
            }))

            const { error: servicesError } = await supabase
              .from("staff_services")
              .insert(staffServices)

            if (servicesError) {
              throw new Error(servicesError.message)
            }
          }

          handleSuccess(
            t("admin-staff.createSuccess"),
            t("admin-staff.createSuccessDescription")
          )
        } catch (err) {
          const error = err as Error
          handleError(error, {
            title: t("admin-staff.createError"),
            defaultMessage: t("admin-staff.createErrorDescription")
          })
          return { error: error.message }
        }
      }

      router.push("/admin/staff")
    } catch (error) {
      console.error("Error submitting form:", error)
      handleError(error, {
        title: staffId ? t("admin-staff.updateError") : t("admin-staff.createError"),
        defaultMessage: staffId 
          ? t("admin-staff.updateErrorDescription") 
          : t("admin-staff.createErrorDescription")
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDiscard = () => {
    setShowDiscardDialog(true)
  }

  const handleConfirmDiscard = () => {
    if (staffId && originalStaff) {
      setStaff(originalStaff)
      setSelectedServices(originalStaff.services)
    } else {
      setStaff({ ...emptyStaffData, branchId })
      setSelectedServices([])
    }
    setStaffImageName("")
    setStaffImage(null)
    setShowDiscardDialog(false)
  }

  // Add form value change handler
  const handleFormValueChange = <T extends keyof StaffFormState>(field: T, value: StaffFormState[T]) => {
    setStaff(prev => ({ ...prev, [field]: value }))
  }

  return {
    staff,
    services,
    staffImageName,
    staffImage,
    isSubmitting,
    showDiscardDialog,
    showPassword,
    errors,
    selectedServices,
    handleServiceChange,
    handleWeeklyHoursChange,
    addTimeSlot,
    removeTimeSlot,
    handleUploadStaffImage,
    handleSubmit,
    handleDiscard,
    handleConfirmDiscard,
    setStaff,
    setShowPassword,
    setShowDiscardDialog,
    handleFormValueChange
  }
} 