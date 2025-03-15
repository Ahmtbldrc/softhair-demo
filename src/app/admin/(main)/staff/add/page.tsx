"use client"

import { useLocale } from "@/contexts/LocaleContext"
import { useBranch } from "@/contexts/BranchContext"
import { StaffForm } from "@/components/staff/staff-form"

export default function AddStaffPage() {
  const { t } = useLocale()
  const { selectedBranchId } = useBranch()
  const tWithParams = t as (key: string) => string

  return <StaffForm branchId={selectedBranchId} t={tWithParams} />
}
