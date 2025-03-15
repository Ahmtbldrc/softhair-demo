import { supabase } from '../supabase'
import { Branch, ApiResponse } from '../types'

export async function getBranchById(id: number): Promise<ApiResponse<Branch>> {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .eq('status', true)
      .single()

    if (error) {
      throw error
    }

    return {
      data: data
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred while fetching branch'
    }
  }
}

export async function getCurrentUserBranch(): Promise<ApiResponse<Branch>> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user?.user_metadata?.selectedBranchId) {
      throw new Error('Error getting user or selectedBranchId not found')
    }

    return getBranchById(user.user_metadata.selectedBranchId)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred while fetching current user branch'
    }
  }
}

export async function getAllBranches(): Promise<ApiResponse<Branch[]>> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      throw new Error('Error getting user')
    }

    const branchIds = user?.user_metadata?.branchIds as number[] | undefined
    
    if (!branchIds || branchIds.length === 0) {
      throw new Error('No branch IDs found in user metadata')
    }

    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('status', true)
      .in('id', branchIds)
      .order('name')

    if (error) {
      throw error
    }

    return {
      data: data
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred while fetching branches'
    }
  }
}

export async function createBranch(
  branch: Omit<Branch, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<Branch>> {
  try {
    const { data, error } = await supabase
      .from('branches')
      .insert([branch])
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      data: data
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred while creating branch'
    }
  }
}

export async function updateBranch(
  id: number,
  updates: Partial<Omit<Branch, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<Branch>> {
  try {
    const { data, error } = await supabase
      .from('branches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      data: data
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred while updating branch'
    }
  }
}

export async function deleteBranch(id: number): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('branches')
      .update({ status: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw error
    }

    return {
      data: true
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred while deleting branch'
    }
  }
}

