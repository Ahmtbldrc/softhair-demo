"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { useLocale } from "@/contexts/LocaleContext";
import { useBranch } from "@/contexts/BranchContext";
import { Service } from "@/lib/types";
import { getActiveServices } from "@/lib/services/service.service";
import { EditServiceDialog } from "@/components/services/EditServiceDialog";
import { DeleteServiceDialog } from "@/components/services/DeleteServiceDialog";
import { AddServiceDialog } from "@/components/services/AddServiceDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceWithBranch } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

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
    console.log("Fetching services for branchId:", selectedBranchId);
    setIsLoading(true);
    try {
      const result = await getActiveServices(selectedBranchId);
      console.log("Services fetch result:", result);
      if (result.error) {
        throw new Error(result.error);
      }
      setServices(result.data as ServiceWithBranch[]);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Selected branch ID changed:", selectedBranchId);
    fetchServices();
  }, [selectedBranchId]);

  // Add a new useEffect to handle initial load
  useEffect(() => {
    const initializeServices = async () => {
      if (!selectedBranchId) {
        // If no branch is selected, try to get the user's selected branch
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.selectedBranchId) {
          fetchServices();
        }
      }
    };

    initializeServices();
  }, []);

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
              <p className="text-2xl font-bold my-2">{service.price?.toFixed(2) ?? "0.00"} €</p>
              <p className="text-sm text-muted-foreground mb-2">
                {service.duration} {t("services.minutes")}
              </p>
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
                <TableHead>{t("services.subservices")}</TableHead>
                <TableHead>{t("services.price")}</TableHead>
                <TableHead>{t("services.duration")}</TableHead>
                <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeletons for desktop
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-6 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                  </TableRow>
                ))
              ) : currentServices.length > 0 ? (
                currentServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="whitespace-nowrap w-[150px]">
                      {service.subServiceIds?.length ? (
                        <HoverCard>
                          <HoverCardTrigger>
                            <div className="inline-block">
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-muted hover:text-primary transition-colors"
                              >
                                {service.subServiceIds.length} {t("services.services")}
                              </Badge>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent 
                            className="w-[500px] p-4" 
                            sideOffset={5}
                            side="top"
                            align="start"
                            avoidCollisions={true}
                            collisionPadding={20}
                          >
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">{t("services.subservices")}</h4>
                              <div className="flex flex-wrap gap-2">
                                {service.subServiceIds.map((id) => {
                                  const subService = services.find(s => s.id === id);
                                  return subService ? (
                                    <span 
                                      key={id} 
                                      className="text-xs bg-muted px-3 py-1.5 rounded-full whitespace-normal"
                                    >
                                      {subService.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap w-[120px]">
                      {service.price?.toFixed(2) ?? "0.00"} €
                    </TableCell>
                    <TableCell className="whitespace-nowrap w-[120px]">
                      {service.duration} {t("services.minutes")}
                    </TableCell>
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
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
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
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              <div className="hidden sm:flex">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </div>

              <div className="sm:hidden">
                <span className="px-4 py-2">
                  {currentPage} / {totalPages}
                </span>
              </div>

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
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
