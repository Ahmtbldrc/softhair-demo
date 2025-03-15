"use client"
import { useEffect, useState } from "react"
import { useLocale } from "@/contexts/LocaleContext"
import { useBranch } from "@/contexts/BranchContext"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { StaffForm } from "@/components/staff-form"

export default function EditStaffPage({ params }: { params: { id: string } }) {
  const { t } = useLocale()
  const { selectedBranchId } = useBranch()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsSubmitting(false)
  }, [])

  const handleFormChange = () => {
    setIsSubmitting(false)
  }

  if (!selectedBranchId) return null

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/staff">
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{t("admin-staff.back")}</span>
            </Button>
          </Link>
          <h1 className="flex-1 text-xl font-semibold tracking-tight">
            {t("admin-staff.staffDetails")}
          </h1>
        </div>
        <StaffForm 
          branchId={selectedBranchId}
          staffId={params.id}
          onFormChange={handleFormChange}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      </main>
    </div>
  )
} 