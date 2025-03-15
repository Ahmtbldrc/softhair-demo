'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLocale } from "@/contexts/LocaleContext";
import { useBranch } from '@/contexts/BranchContext'
import { getRecentTransactions } from '@/lib/services/reservation.service'

type Transaction = {
  customer: string;
  email: string;
  staff: string;
  service: string;
  date: string;
  amount: number;
}

export default function TransactionsChart() {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3
  const totalPages = Math.ceil(transactions.length / itemsPerPage)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (selectedBranchId <= 0) return;

      const { data } = await getRecentTransactions(selectedBranchId)
      setTransactions(data || [])
    }

    fetchTransactions()
  }, [selectedBranchId])

  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>{t("transactions.transactions")}</CardTitle>
          <CardDescription>
            {t("transactions.recentTransactions")}
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
              <TableHead>{t("transactions.customer")}</TableHead>
              <TableHead>{t("transactions.staff")}</TableHead>
              <TableHead>{t("transactions.service")}</TableHead>
              <TableHead className="hidden xl:table-cell">{t("transactions.date")}</TableHead>
              <TableHead className="text-right">{t("transactions.amount")}</TableHead>
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
                    {new Date(transaction.date).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }).replace(',', '')}
                </TableCell>
                <TableCell className="text-right">{transaction.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            {t("transactions.showing")} {(currentPage - 1) * itemsPerPage + 1} {t("transactions.to")} {Math.min(currentPage * itemsPerPage, transactions.length)} {t("transactions.of")} {transactions.length} {t("transactions.entries")}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{t("transactions.previousPage")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">{t("transactions.nextPage")}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}