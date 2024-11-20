'use client'

import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from '@/lib/supabase'

type StaffData = {
  id: number;
  name: string;
  image: string;
  initials: string;
  weeklyEarnings: number;
}

export default function StaffWeeklyTrendChart() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4
  const [staffData, setStaffData] = useState<StaffData[]>([])
  const totalPages = Math.ceil(staffData.length / itemsPerPage)

  const fetchStaffSalesData = async () => {
    const { data, error } = await supabase.rpc('get_recent_sales_by_staff')
    if (error) {
      console.error('Error fetching staff sales data:', error)
    } else {

      const parsedData = data.map((staff: { 
        id: number;
        name: string;
        image: string;
        initials: string;
        weeklyearnings: number;
      }) => ({
        ...staff,
        weeklyEarnings: staff.weeklyearnings
      }))
      setStaffData(parsedData)
    }
  }

  useEffect(() => {
    fetchStaffSalesData()
  }, [])

  const paginatedStaff = staffData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Sales</CardTitle>
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
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, staffData.length)} of {staffData.length} staff members
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}