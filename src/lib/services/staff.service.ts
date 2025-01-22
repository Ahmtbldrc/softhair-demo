import { supabase } from "@/lib/supabase"
import { StaffFormState } from "@/hooks/use-staff-form"
import { Service } from "@/lib/database.types"
import { Roles } from "../types"

interface StaffWithServices {
  id: number
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
  userId: string
  status: boolean
  image: string
  branchId: number
  created_at: string
  updated_at: string
  services: Array<{
    service: {
      id: number
      name: string
    }
  }>
  weeklyHours: {
    SUN: Array<{ start: string; end: string }>
    MON: Array<{ start: string; end: string }>
    TUE: Array<{ start: string; end: string }>
    WED: Array<{ start: string; end: string }>
    THU: Array<{ start: string; end: string }>
    FRI: Array<{ start: string; end: string }>
    SAT: Array<{ start: string; end: string }>
  }
  languages: string[]
}

export async function getActiveStaff(branchId: number) {
  const { data, error } = await supabase
    .from("staff")
    .select(`
      *,
      services:staff_services (
        service:services (
          id,
          name
        )
      )
    `)
    .eq("branchId", branchId)
    .eq("status", true)

  if (error) {
    return { error: error.message }
  }

  return { data: data as StaffWithServices[] }
}

export async function getAllStaff(branchId: number) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    const { data, error } = await supabase
      .from("staff")
      .select(`
        *,
        services:staff_services (
          service:services (
            id,
            name
          )
        )
      `)
      .eq("branchId", branchId)
      .neq("userId", currentUserId)
      .order("status", { ascending: false }); // true (active) comes before false (passive)

    if (error) {
      return { error: error.message };
    }

    return { data: data as StaffWithServices[] };
  } catch (err) {
    console.error("Failed to fetch staff members:", err);
    return { error: "Failed to fetch staff members" };
  }
}

export async function getStaffById(id: number) {
  try {
    const { data, error } = await supabase
      .from("staff")
      .select("*, services:staff_services(service:service_id(id, name))")
      .eq("id", id)
      .single()

    if (error) {
      return { error: error.message }
    }

    return { data: data as StaffWithServices }
  } catch (err) {
    console.error("Failed to fetch staff member:", err)
    return { error: "Failed to fetch staff member" }
  }
}

export async function createStaff(staff: StaffFormState) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `${staff.username.toLowerCase()}@softsidedigital.com`,
      password: staff.password,
      user_metadata: {
        fullName: `${staff.firstName} ${staff.lastName}`,
        username: staff.username,
        email: staff.email,
        role: Roles.STAFF,
        staffId: null
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    // Create staff record
    const { data, error } = await supabase
      .from("staff")
      .insert({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        username: staff.username,
        status: staff.status,
        image: staff.image,
        branchId: staff.branchId,
        weeklyHours: staff.weeklyHours,
        userId: authData.user.id
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Update user metadata with staffId
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      {
        user_metadata: {
          fullName: `${staff.firstName} ${staff.lastName}`,
          username: staff.username,
          email: staff.email,
          role: Roles.STAFF,
          staffId: data.id
        }
      }
    )

    if (updateError) {
      return { error: updateError.message }
    }

    // Create staff services
    if (staff.services.length > 0) {
      const { error: servicesError } = await supabase
        .from("staff_services")
        .insert(
          staff.services.map(serviceId => ({
            staff_id: data.id,
            service_id: serviceId
          }))
        )

      if (servicesError) {
        return { error: servicesError.message }
      }
    }

    return { data }
  } catch (err) {
    console.error("Failed to create staff member:", err)
    return { error: "Failed to create staff member" }
  }
}

export async function updateStaff(id: number, staff: StaffFormState) {
  try {
    // Update staff record
    const { error } = await supabase
      .from("staff")
      .update({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        username: staff.username,
        status: staff.status,
        image: staff.image,
        weeklyHours: staff.weeklyHours
      })
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    // Update user metadata
    if (staff.userId) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        staff.userId,
        {
          user_metadata: {
            fullName: `${staff.firstName} ${staff.lastName}`,
            username: staff.username,
            email: staff.email,
            role: Roles.STAFF,
            staffId: id
          }
        }
      )

      if (updateError) {
        return { error: updateError.message }
      }
    }

    // Update staff services
    const { error: deleteError } = await supabase
      .from("staff_services")
      .delete()
      .eq("staff_id", id)

    if (deleteError) {
      return { error: deleteError.message }
    }

    if (staff.services.length > 0) {
      const { error: servicesError } = await supabase
        .from("staff_services")
        .insert(
          staff.services.map(serviceId => ({
            staff_id: id,
            service_id: serviceId
          }))
        )

      if (servicesError) {
        return { error: servicesError.message }
      }
    }

    return { data: null }
  } catch (err) {
    console.error("Failed to update staff member:", err)
    return { error: "Failed to update staff member" }
  }
}

export async function deleteStaff(id: number) {
  try {
    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    return { data: null }
  } catch (err) {
    console.error("Failed to delete staff member:", err)
    return { error: "Failed to delete staff member" }
  }
}

export async function uploadStaffImage(file: File, fileName: string) {
  try {
    const { error } = await supabase.storage
      .from("staff")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true
      })

    if (error) {
      return { error: error.message }
    }

    return { data: null }
  } catch (err) {
    console.error("Failed to upload staff image:", err)
    return { error: "Failed to upload staff image" }
  }
}

export async function updateStaffAuth(
  userId: string,
  email: string,
  password: string,
  metadata: {
    fullName: string
    username: string
    email: string
  }
) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email,
      password,
      user_metadata: metadata
    })

    if (error) {
      return { error: error.message }
    }

    return { data: null }
  } catch (err) {
    console.error("Failed to update staff auth:", err)
    return { error: "Failed to update staff auth" }
  }
}

export async function checkUsernameExists(username: string, excludeId?: number) {
  const query = supabase
    .from("staff")
    .select("id")
    .eq("username", username)

  if (excludeId) {
    query.neq("id", excludeId)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { exists: data.length > 0 }
}

export async function checkEmailExists(email: string, excludeId?: number) {
  const query = supabase
    .from("staff")
    .select("id")
    .eq("email", email)

  if (excludeId) {
    query.neq("id", excludeId)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { exists: data.length > 0 }
}

export async function getActiveServices(branchId: number) {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("branchId", branchId)
      .eq("status", true)

    if (error) {
      return { error: error.message }
    }

    return { data: data as Service[] }
  } catch (err) {
    console.error("Failed to fetch active services:", err)
    return { error: "Failed to fetch active services" }
  }
} 