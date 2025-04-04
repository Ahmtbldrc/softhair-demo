import { Database } from "@/lib/database.types";
import CustomersClient from "@/app/admin/(main)/customers/customers-client";
import { supabase } from "@/lib/supabase"

type Customer = Database["public"]["Tables"]["customers"]["Row"] & {
  gender: "male" | "female";
};

export default async function CustomersPage() {
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("createdAt", { ascending: false });

  const typedCustomers = (customers || []).map(customer => ({
    ...customer,
    gender: customer.gender === "male" || customer.gender === "female" 
      ? customer.gender 
      : "male"
  })) as Customer[];

  return <CustomersClient initialCustomers={typedCustomers} />;
} 