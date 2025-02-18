'use client'

import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRecentSalesByStaff } from '@/lib/services/staff.service'
import { useLocale } from "@/contexts/LocaleContext"
import { useBranch } from '@/contexts/BranchContext'
import { RecentSalesByStaffView } from '@/lib/database.aliases'

type StaffData = {
  id: number;
  name: string;
  image: string;
  initials: string;
  weeklyEarnings: number;
}

export default function StaffWeeklyTrendChart() {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4
  const [staffData, setStaffData] = useState<StaffData[]>([])
  const totalPages = Math.ceil(staffData.length / itemsPerPage)

  const fetchStaffSalesData = async () => {
    if (selectedBranchId <= 0) {
      setStaffData([]);
      return;
    }

    const result = await getRecentSalesByStaff(selectedBranchId)
    if (result.error || !result.data) {
      console.error('Error fetching staff sales data:', result.error)
      setStaffData([])
      return
    }

    const parsedData = result.data.map((staff: RecentSalesByStaffView) => ({
      id: staff.id || 0,
      name: staff.name || '',
      image: staff.image || '',
      initials: staff.initials || '',
      weeklyEarnings: staff.weeklyEarnings || 0
    }))
    setStaffData(parsedData)
  }

  useEffect(() => {
    fetchStaffSalesData()
  }, [selectedBranchId])

  const paginatedStaff = staffData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("staff-weekly-trend.recentSales")}</CardTitle>
        {/* <Button onClick={exportToCSV} size="sm" className="gap-1">
          Export CSV
          <ArrowDownToLine className="h-4 w-4" />
        </Button> */}
      </CardHeader>
      <CardContent className="grid gap-6">
        {paginatedStaff.map((staff) => (
          <div key={staff.id} className="flex items-center gap-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staff.image}`} alt={`${staff.name}'s avatar`} />
              <AvatarFallback>{staff.initials}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm font-medium leading-none">
                {staff.name}
              </p>
            </div>
            <div className="ml-auto font-medium">
              {staff.weeklyEarnings.toFixed(2)} CHF
            </div>
          </div>
        ))}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2 py-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            {t("staff-weekly-trend.showing")} {(currentPage - 1) * itemsPerPage + 1} {t("staff-weekly-trend.to")} {Math.min(currentPage * itemsPerPage, staffData.length)} {t("staff-weekly-trend.of")} {staffData.length} {t("staff-weekly-trend.staffMembers")}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{t("staff-weekly-trend.previousPage")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">{t("staff-weekly-trend.nextPage")}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}