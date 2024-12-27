"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Branch } from "@/lib/types";
import { getAllBranches } from "@/lib/services/branch.service";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";

interface BranchContextType {
  branches: Branch[];
  selectedBranchId: string;
  isLoading: boolean;
  updateSelectedBranch: (branchId: string) => Promise<void>;
  refreshBranches: () => Promise<void>;
}

export const BranchContext = createContext<BranchContextType>({
  branches: [],
  selectedBranchId: "",
  isLoading: false,
  updateSelectedBranch: async () => {},
  refreshBranches: async () => {},
});

export function BranchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const refreshBranches = async () => {
    try {
      const [branchesData, { data: { user } }] = await Promise.all([
        getAllBranches(),
        supabase.auth.getUser()
      ]);
      
      setBranches(branchesData);
      if (user?.user_metadata?.selectedBranchId) {
        setSelectedBranchId(user.user_metadata.selectedBranchId.toString());
      }
    } catch (error) {
      console.error("Error fetching branch data:", error);
    }
  };

  const updateSelectedBranch = async (branchId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...((await supabase.auth.getUser()).data.user?.user_metadata || {}),
          selectedBranchId: parseInt(branchId)
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update selected branch",
          variant: "destructive"
        });
        return;
      }

      setSelectedBranchId(branchId);
      toast({
        title: "Success",
        description: "Branch selected successfully",
        variant: "default"
      });
    } catch (error) {
      console.error("Error updating selected branch:", error);
      toast({
        title: "Error",
        description: "Failed to update selected branch",
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
        setSelectedBranchId(session.user.user_metadata.selectedBranchId.toString());
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]); // Re-run when route changes

  return (
    <BranchContext.Provider 
      value={{ 
        branches, 
        selectedBranchId, 
        isLoading,
        updateSelectedBranch,
        refreshBranches
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
} 