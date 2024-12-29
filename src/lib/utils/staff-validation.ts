import { StaffFormData } from "@/lib/database.types"
import { checkEmailExists, checkUsernameExists } from "@/lib/services/staff.service"

export interface ValidationError {
  field: string
  message: string
}

export async function validateStaffForm(
  data: Partial<StaffFormData>, 
  t: (key: string) => string,
  excludeId?: number
): Promise<ValidationError[]> {
  const errors: ValidationError[] = []

  // Required fields
  if (!data.firstName?.trim()) {
    errors.push({
      field: "firstName",
      message: t("admin-staff.firstNameRequired")
    })
  }

  if (!data.lastName?.trim()) {
    errors.push({
      field: "lastName",
      message: t("admin-staff.lastNameRequired")
    })
  }

  if (!data.email?.trim()) {
    errors.push({
      field: "email",
      message: t("admin-staff.emailRequired")
    })
  } else if (!isValidEmail(data.email)) {
    errors.push({
      field: "email",
      message: t("admin-staff.invalidEmail")
    })
  } else {
    const { error, exists } = await checkEmailExists(data.email, excludeId)
    if (error) {
      errors.push({
        field: "email",
        message: t("admin-staff.emailCheckError")
      })
    } else if (exists) {
      errors.push({
        field: "email",
        message: t("admin-staff.emailAlreadyExists")
      })
    }
  }

  if (!data.username?.trim()) {
    errors.push({
      field: "username",
      message: t("admin-staff.usernameRequired")
    })
  } else if (!isValidUsername(data.username)) {
    errors.push({
      field: "username",
      message: t("admin-staff.invalidUsername")
    })
  } else {
    const { error, exists } = await checkUsernameExists(data.username, excludeId)
    if (error) {
      errors.push({
        field: "username",
        message: t("admin-staff.usernameCheckError")
      })
    } else if (exists) {
      errors.push({
        field: "username",
        message: t("admin-staff.usernameAlreadyExists")
      })
    }
  }

  if (!excludeId && !data.password?.trim()) {
    errors.push({
      field: "password",
      message: t("admin-staff.passwordRequired")
    })
  } else if (data.password && !isValidPassword(data.password)) {
    errors.push({
      field: "password",
      message: t("admin-staff.invalidPassword")
    })
  }

  // Image validation for new staff
  if (!excludeId && !data.image) {
    errors.push({
      field: "image",
      message: t("admin-staff.imageRequired")
    })
  }

  // Services validation
  if (!data.services || data.services.length === 0) {
    errors.push({
      field: "services",
      message: t("admin-staff.servicesRequired")
    })
  }

  // Weekly hours validation
  if (!data.weeklyHours) {
    errors.push({
      field: "weeklyHours",
      message: t("admin-staff.weeklyHoursRequired")
    })
  } else {
    const hasAnyTimeSlot = Object.values(data.weeklyHours).some(slots => slots.length > 0)
    if (!hasAnyTimeSlot) {
      errors.push({
        field: "weeklyHours",
        message: t("admin-staff.atLeastOneTimeSlotRequired")
      })
    }
  }

  return errors
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_\.]{3,20}$/
  return usernameRegex.test(username)
}

function isValidPassword(password: string): boolean {
  return password.length >= 8 && !/\s/.test(password);
} 