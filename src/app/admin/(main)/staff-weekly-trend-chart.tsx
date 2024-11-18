'use client'

import React, { useState } from 'react'
import { ArrowDownToLine, ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const staffData = [
  { id: 1, name: "Olivia Martin", image: "/image/staff.png", initials: "OM", weeklyEarnings: 1999.00 },
  { id: 2, name: "Jackson Lee", image: "/image/staff.png", initials: "JL", weeklyEarnings: 1239.00 },
  { id: 3, name: "Isabella Nguyen", image: "/image/staff.png", initials: "IN", weeklyEarnings: 1299.00 },
  { id: 4, name: "William Kim", image: "/image/staff.png", initials: "WK", weeklyEarnings: 999.00 },
  { id: 5, name: "Sofia Davis", image: "/image/staff.png", initials: "SD", weeklyEarnings: 939.00 },
  { id: 6, name: "Emma Johnson", image: "/image/staff.png", initials: "EJ", weeklyEarnings: 1599.00 },
  { id: 7, name: "Liam Wilson", image: "/image/staff.png", initials: "LW", weeklyEarnings: 1399.00 },
  { id: 8, name: "Ava Thompson", image: "/image/staff.png", initials: "AT", weeklyEarnings: 1199.00 },
]

export default function StaffWeeklyTrendChart() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4
  const totalPages = Math.ceil(staffData.length / itemsPerPage)

  const exportToCSV = () => {
    const headers = ["Name", "Weekly Earnings (CHF)"]
    const csvContent = [
      headers.join(','),
      ...staffData.map(staff => 
        [staff.name, staff.weeklyEarnings.toFixed(2)].join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "staff_earnings.csv")
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

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
              <AvatarImage src={staff.image} alt={`${staff.name}'s avatar`} />
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