"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useBranch } from "@/contexts/BranchContext";
import { StaffList } from "@/components/staff/staff-list";

export default function StaffPage() {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();
  const tWithParams = t as (key: string, params?: Record<string, string | number>) => string;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="container mx-auto p-4">
          <StaffList branchId={selectedBranchId} t={tWithParams} />
        </div>
      </main>
    </div>
  );
}
