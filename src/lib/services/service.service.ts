import { supabase } from "@/lib/supabase"
import { Service } from "@/lib/database.types"

export async function createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from("services")
    .insert([{ ...service, status: true }])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: data as Service }
}

export async function updateService(id: number, updates: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: data as Service }
}

export async function deleteService(id: number) {
  const { error } = await supabase
    .from("services")
    .update({ status: false })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  return { data: null }
}

export async function getActiveServices(branchId: number) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("branchId", branchId)
    .eq("status", true)

  if (error) {
    return { error: error.message }
  }

  return { data: data as Service[] }
}

export async function getAllServices(branchId: number) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("branchId", branchId)
    .eq("status", true)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return data as Service[]
} 