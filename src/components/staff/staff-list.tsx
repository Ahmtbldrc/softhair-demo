import Link from "next/link"
import { PlusCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationWithState } from "@/components/ui/pagination"
import { StaffMember } from "@/components/staff/staff-member"
import { useStaffList } from "@/hooks/use-staff-list"

interface StaffListProps {
  branchId: number
  t: (key: string) => string
}

export function StaffList({ branchId, t }: StaffListProps) {
  const {
    staff,
    isLoading,
    isDeleting,
    showDeleteDialog,
    currentPage,
    totalPages,
    activeTab,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handlePageChange,
    handleTabChange
  } = useStaffList({ branchId, t })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("admin-staff.staffManagement")}
        </h1>
        <Link href="/admin/staff/add">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("admin-staff.addStaff")}
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="0">{t("admin-staff.all")}</TabsTrigger>
          <TabsTrigger value="1">{t("admin-staff.active")}</TabsTrigger>
          <TabsTrigger value="2">{t("admin-staff.passive")}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>{t("admin-staff.staffList")}</CardTitle>
              <CardDescription>
                {t("admin-staff.manageStaffAndViewServices")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">
                        <span className="sr-only">{t("admin-staff.image")}</span>
                      </TableHead>
                      <TableHead>{t("admin-staff.fullName")}</TableHead>
                      <TableHead>{t("admin-staff.status")}</TableHead>
                      <TableHead>{t("admin-staff.services")}</TableHead>
                      <TableHead>{t("admin-staff.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <StaffMember
                        key={member.id}
                        staff={member}
                        onDelete={handleDelete}
                        t={t}
                        view="table"
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="grid gap-4 md:hidden">
                {staff.map((member) => (
                  <StaffMember
                    key={member.id}
                    staff={member}
                    onDelete={handleDelete}
                    t={t}
                    view="card"
                  />
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <PaginationWithState
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDeleteDialog} onOpenChange={handleCancelDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin-staff.areYouSure")}</DialogTitle>
            <DialogDescription>
              {t("admin-staff.thisActionCannotBeUndone")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              {t("admin-staff.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin-staff.deleteStaff")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 