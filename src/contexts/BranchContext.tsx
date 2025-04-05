"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Branch } from "@/lib/database.aliases";
import { getAllBranches } from "@/lib/services/branch.service";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";

export interface BranchContextType {
  branches: Branch[];
  selectedBranchId: number;
  isLoading: boolean;
  updateSelectedBranch: (branchId: number) => Promise<void>;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

interface BranchProviderProps {
  children: ReactNode;
}

export function BranchProvider({ children }: BranchProviderProps) {
  const pathname = usePathname();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(() => {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const storedBranchId = localStorage.getItem('selectedBranchId');
      return storedBranchId ? parseInt(storedBranchId) : 0;
    }
    return 0;
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshBranches = async () => {
    if (pathname.includes('/login')) {
      return;
    }

    try {
      const [branchesResult, { data: { user } }] = await Promise.all([
        getAllBranches(),
        supabase.auth.getUser()
      ]);
      
      if (branchesResult.error) {
        throw new Error(branchesResult.error);
      }

      setBranches(branchesResult.data ?? []);
      
      if (user?.user_metadata?.selectedBranchId) {
        const newBranchId = user.user_metadata.selectedBranchId;
        setSelectedBranchId(newBranchId);
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedBranchId', newBranchId.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching branch data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch branches",
        variant: "destructive"
      });
    }
  };

  const updateSelectedBranch = async (branchId: number): Promise<void> => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...(user?.user_metadata || {}),
          selectedBranchId: branchId
        }
      });

      if (updateError) {
        throw updateError;
      }

      setSelectedBranchId(branchId);
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedBranchId', branchId.toString());
      }
      toast({
        title: "Success",
        description: "Branch selected successfully"
      });
    } catch (error) {
      console.error("Error updating selected branch:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update selected branch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshBranches();
  }, []);

  // Listen for route changes and auth state changes
  useEffect(() => {
    refreshBranches();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.user_metadata?.selectedBranchId) {
        setSelectedBranchId(session.user.user_metadata.selectedBranchId);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]); // Re-run when route changes

  const value: BranchContextType = {
    branches,
    selectedBranchId,
    isLoading,
    updateSelectedBranch,
    refreshBranches
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch(): BranchContextType {
  const context = useContext(BranchContext);
  
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  
  return context;
} 