import { useState, useEffect } from "react"
import { StaffWithServices } from "@/lib/database.types"
import { getAllStaff, deleteStaff } from "@/lib/services/staff.service"
import { handleError, handleSuccess } from "@/lib/utils/error-handler"

interface UseStaffListProps {
  branchId: number
  t: (key: string) => string
}

export function useStaffList({ branchId, t }: UseStaffListProps) {
  const [staff, setStaff] = useState<StaffWithServices[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("0")

  const itemsPerPage = 10
  const totalPages = Math.ceil(staff.length / itemsPerPage)

  useEffect(() => {
    if (branchId) {
      fetchStaff()
    }
  }, [branchId])

  const fetchStaff = async () => {
    setIsLoading(true)
    try {
      const result = await getAllStaff(branchId)
      if (result.error) {
        throw new Error(result.error)
      }
      setStaff(result.data ?? [])
    } catch (error) {
      handleError(error, {
        title: t("admin-staff.fetchError"),
        defaultMessage: t("admin-staff.fetchErrorDescription")
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (staffId: number) => {
    setSelectedStaffId(staffId)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedStaffId) return

    setIsDeleting(true)
    try {
      const result = await deleteStaff(selectedStaffId)
      if (result.error) {
        throw new Error(result.error)
      }

      setStaff(prev => prev.filter(s => s.id !== selectedStaffId))
      setShowDeleteDialog(false)
      handleSuccess(
        t("admin-staff.deleteSuccess"),
        t("admin-staff.deleteSuccessDescription")
      )
    } catch (error) {
      handleError(error, {
        title: t("admin-staff.deleteError"),
        defaultMessage: t("admin-staff.deleteErrorDescription")
      })
    } finally {
      setIsDeleting(false)
      setSelectedStaffId(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
    setSelectedStaffId(null)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1)
  }

  const filteredStaff = staff.filter(s => {
    if (activeTab === "0") return true
    if (activeTab === "1") return s.status
    return !s.status
  })

  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return {
    staff: paginatedStaff,
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
  }
} 