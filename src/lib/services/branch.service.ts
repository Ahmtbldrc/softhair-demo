import { supabase } from "../supabase";
import { Branch } from "../types";

export const getBranchById = async (branchId: number): Promise<Branch | null> => {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("id", branchId)
    .eq("status", true)
    .single();

  if (error) {
    console.error("Error fetching branch:", error);
    return null;
  }

  return data;
};

export const getCurrentUserBranch = async (): Promise<Branch | null> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user?.user_metadata?.selectedBranchId) {
    console.error("Error getting user or selectedBranchId not found");
    return null;
  }

  return getBranchById(user.user_metadata.selectedBranchId);
};

export const getAllBranches = async (): Promise<Branch[]> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error("Error getting user:", userError);
    return [];
  }

  const branchIds = user?.user_metadata?.branchIds as number[] | undefined;
  
  if (!branchIds || branchIds.length === 0) {
    console.error("No branch IDs found in user metadata");
    return [];
  }

  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("status", true)
    .in("id", branchIds)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching branches:", error);
    return [];
  }

  return data;
};

export const createBranch = async (name: string): Promise<Branch | null> => {
  const { data, error } = await supabase
    .from('branches')
    .insert({ 
      name: name.trim(),
      status: true 
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating branch:", error);
    return null;
  }

  // Get current user and metadata
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error("Error getting user:", userError);
    return data;
  }

  // Get current branchIds from metadata
  const currentBranchIds = user?.user_metadata?.branchIds as number[] || [];
  
  // Add new branch ID to the list
  const updatedBranchIds = [...currentBranchIds, data.id];

  // Update user metadata with new branchIds while preserving other metadata
  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...user?.user_metadata,
      branchIds: updatedBranchIds
    }
  });

  if (updateError) {
    console.error("Error updating user metadata:", updateError);
  }

  return data;
};

export const updateBranch = async (id: number, name: string): Promise<boolean> => {
  const { error } = await supabase
    .from('branches')
    .update({ name: name.trim() })
    .eq('id', id);

  if (error) {
    console.error("Error updating branch:", error);
    return false;
  }

  return true;
};

export const deleteBranch = async (id: number): Promise<boolean> => {
  const { error } = await supabase
    .from('branches')
    .update({ status: false })
    .eq('id', id);

  if (error) {
    console.error("Error deleting branch:", error);
    return false;
  }

  return true;
};

