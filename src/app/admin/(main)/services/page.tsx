"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { useLocale } from "@/contexts/LocaleContext";
import { useBranch } from "@/contexts/BranchContext";
import { Service } from "@/lib/types";
import { getAllServices } from "@/lib/services/service.service";
import { EditServiceDialog } from "@/components/services/EditServiceDialog";
import { DeleteServiceDialog } from "@/components/services/DeleteServiceDialog";
import { AddServiceDialog } from "@/components/services/AddServiceDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesPage() {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const data = await getAllServices(selectedBranchId);
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedBranchId]); // Re-fetch when selectedBranchId changes

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  // Calculate pagination
  const totalPages = Math.ceil(services.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServices = services.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <h1 className="text-2xl font-bold">{t("services.title")}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("services.addNew")}
        </Button>
      </div>

      {/* Mobile View */}
      <div className="block sm:hidden">
        {isLoading ? (
          // Loading skeletons for mobile
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="mb-4 p-4 border rounded-lg">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-8 w-1/2 mb-4" />
              <div className="flex justify-end gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          ))
        ) : currentServices.length > 0 ? (
          currentServices.map((service) => (
            <div key={service.id} className="mb-4 p-4 border rounded-lg">
              <h3 className="font-medium text-lg">{service.name}</h3>
              <p className="text-2xl font-bold my-2">{service.price.toFixed(2)} CHF</p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleEditClick(service)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleDeleteClick(service)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t("services.noResults")}
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("services.name")}</TableHead>
                <TableHead>{t("services.price")}</TableHead>
                <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeletons for desktop
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-6 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                  </TableRow>
                ))
              ) : currentServices.length > 0 ? (
                currentServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.price.toFixed(2)} CHF</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditClick(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteClick(service)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    {t("services.noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && services.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent className="flex flex-wrap justify-center gap-2">
              <PaginationItem>
                <Button
                  variant="ghost"
                  className="gap-1 pl-2.5"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("common.previous")}</span>
                </Button>
              </PaginationItem>

              <div className="hidden sm:flex">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <Button
                      variant={currentPage === page ? "outline" : "ghost"}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                ))}
              </div>

              <div className="sm:hidden">
                <span className="px-4 py-2">
                  {currentPage} / {totalPages}
                </span>
              </div>

              <PaginationItem>
                <Button
                  variant="ghost"
                  className="gap-1 pr-2.5"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline">{t("common.next")}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AddServiceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onServiceAdded={fetchServices}
      />

      {selectedService && (
        <>
          <EditServiceDialog
            service={selectedService}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onServiceUpdated={fetchServices}
          />

          <DeleteServiceDialog
            service={selectedService}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onServiceDeleted={fetchServices}
          />
        </>
      )}
    </div>
  );
}
