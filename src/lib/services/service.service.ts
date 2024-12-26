import { supabase } from "@/lib/supabase";
import { Service } from "@/lib/types";

export async function getAllServices(branchId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("branchId", parseInt(branchId))
    .eq("status", true)
    .order("name");

  if (error) {
    throw error;
  }

  return data as Service[];
}

export async function createService({
  name,
  price,
  status,
  branchId,
}: {
  name: string;
  price: number;
  status: boolean;
  branchId: number;
}) {
  const { data, error } = await supabase
    .from("services")
    .insert([{ name, price, status, branchId }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateService(
  id: number,
  updates: {
    name?: string;
    price?: number;
    status?: boolean;
  }
) {
  const { data, error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteService(id: number) {
  const { error } = await supabase
    .from("services")
    .update({ status: false })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
} 