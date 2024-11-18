'use client'

import React, { useState } from 'react'
import { ArrowDownToLine, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const transactions = [
  { customer: "Liam Johnson", email: "liam@example.com", staff: "Sarah Parker", service: "Haircut", date: "2023-06-23", amount: "250.00 CHF" },
  { customer: "Olivia Smith", email: "olivia@example.com", staff: "John Doe", service: "Coloring",  date: "2023-06-24", amount: "150.00 CHF" },
  { customer: "Noah Williams", email: "noah@example.com", staff: "Emma White", service: "Styling",  date: "2023-06-25", amount: "350.00 CHF" },
  { customer: "Emma Brown", email: "emma@example.com", staff: "Michael Green", service: "Manicure",  date: "2023-06-26", amount: "450.00 CHF" },
  { customer: "Liam Johnson", email: "liam@example.com", staff: "Sarah Parker", service: "Pedicure",  date: "2023-06-27", amount: "550.00 CHF" },
  { customer: "Sophia Davis", email: "sophia@example.com", staff: "Robert Brown", service: "Facial",  date: "2023-06-28", amount: "650.00 CHF" },
  { customer: "Mason Miller", email: "mason@example.com", staff: "Jennifer Lee", service: "Massage",  date: "2023-06-29", amount: "750.00 CHF" },
  { customer: "Ava Wilson", email: "ava@example.com", staff: "David Taylor", service: "Haircut",  date: "2023-06-30", amount: "200.00 CHF" },
  { customer: "Ethan Moore", email: "ethan@example.com", staff: "Sarah Parker", service: "Coloring",  date: "2023-07-01", amount: "300.00 CHF" },
  { customer: "Isabella Taylor", email: "isabella@example.com", staff: "John Doe", service: "Styling",  date: "2023-07-02", amount: "400.00 CHF" },
]

export default function TransactionsChart() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3
  const totalPages = Math.ceil(transactions.length / itemsPerPage)

  const exportToCSV = () => {
    const headers = ["Customer", "Email", "Staff", "Service", "Date", "Amount"]
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => 
        [t.customer, t.email, t.staff, t.service, t.date, t.amount].join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "transactions.csv")
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Recent transactions from your store.
          </CardDescription>
        </div>
        {/* <Button onClick={exportToCSV} size="sm" className="ml-auto gap-1">
          Export CSV
          <ArrowDownToLine className="h-4 w-4" />
        </Button> */}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Service</TableHead>
              <TableHead className="hidden xl:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="font-medium">{transaction.customer}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {transaction.email}
                  </div>
                </TableCell>
                <TableCell>{transaction.staff}</TableCell>
                <TableCell>{transaction.service}</TableCell>
                {/* <TableCell className="hidden xl:table-cell">
                  {transaction.type}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Badge className="text-xs" variant="outline">
                    {transaction.status}
                  </Badge>
                </TableCell> */}
                <TableCell className="hidden xl:table-cell">
                  {transaction.date}
                </TableCell>
                <TableCell className="text-right">{transaction.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} entries
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