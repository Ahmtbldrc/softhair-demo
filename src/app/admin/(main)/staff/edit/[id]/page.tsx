"use client"

import { useLocale } from "@/contexts/LocaleContext"
import { useBranch } from "@/contexts/BranchContext"
import { StaffForm } from "@/components/staff/staff-form"
import { useParams } from "next/navigation"

export default function EditStaffPage() {
  const { t } = useLocale()
  const { selectedBranchId } = useBranch()
  const { id } = useParams()
  const tWithParams = t as (key: string) => string

  return <StaffForm branchId={selectedBranchId} staffId={id as string} t={tWithParams} />
}