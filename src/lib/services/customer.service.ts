import { supabase } from "../supabase"

export const searchCustomers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return { data: [] }

    const term = searchTerm.toLowerCase().trim()

    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${term}%,surname.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error searching customers:', error)
        return { error: error.message }
    }

    return { data }
} 