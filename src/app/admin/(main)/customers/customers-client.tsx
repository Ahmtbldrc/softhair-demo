"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Search, Mail, Phone, User, ChevronLeft, ChevronRight } from "lucide-react";
import { 
  CustomerForm, 
  CustomerFormValues, 
  DeleteCustomerDialog
} from "@/components/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Customer = Database["public"]["Tables"]["customers"]["Row"] & {
  gender: "male" | "female";
};

interface CustomersClientProps {
  initialCustomers: Customer[];
}

export default function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const { t } = useLocale();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const router = useRouter();
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) {
        throw error;
      }

      // Ensure gender is either "male" or "female"
      const typedCustomers = (data || []).map(customer => ({
        ...customer,
        gender: customer.gender === "male" || customer.gender === "female" 
          ? customer.gender 
          : "male"
      })) as Customer[];

      setCustomers(typedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: t("customers.error.title"),
        description: t("customers.error.description"),
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (editingCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from("customers")
          .update({
            name: values.name,
            surname: values.surname,
            email: values.email || null,
            phone: values.phone || null,
            gender: values.gender,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", editingCustomer.id);

        if (error) throw error;

        toast({
          title: t("common.success"),
          description: t("customers.updateSuccess"),
        });
      } else {
        // Create new customer
        const { error } = await supabase
          .from("customers")
          .insert({
            name: values.name,
            surname: values.surname,
            email: values.email || null,
            phone: values.phone || null,
            gender: values.gender,
            createdAt: new Date().toISOString(),
          });

        if (error) throw error;

        toast({
          title: t("common.success"),
          description: t("customers.createSuccess"),
        });
      }

      // Close dialog
      setIsDialogOpen(false);
      setEditingCustomer(null);
      
      // Refresh customers list
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: t("customers.error.title"),
        description: t("customers.error.description"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("customers.deleteSuccess"),
      });

      // Close delete dialog
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);

      // Refresh customers list
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: t("customers.error.title"),
        description: t("customers.error.description"),
        variant: "destructive",
      });
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      handleDeleteCustomer(customerToDelete.id);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.surname.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchLower))
    );
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("customers.title")}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCustomer(null);
              setIsDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              {t("customers.newCustomer")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? t("customers.editCustomer") : t("customers.newCustomer")}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? t("customers.editDescription")
                  : t("customers.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <CustomerForm 
              initialData={editingCustomer}
              onSubmit={onSubmit}
              isLoading={isSubmitting}
              isOpen={isDialogOpen}
              onClose={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("customers.search")}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-8">{t("customers.noCustomers")}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {paginatedCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                  <CardTitle className="text-base font-medium">
                    {customer.name} {customer.surname}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 p-0">
                        <span className="sr-only">{t("customers.actions")}</span>
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditCustomer(customer)}
                      >
                        {t("customers.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setCustomerToDelete(customer);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        {t("customers.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-1.5">
                    {customer.email && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Mail className="mr-1.5 h-3.5 w-3.5" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Phone className="mr-1.5 h-3.5 w-3.5" />
                        {customer.phone}
                      </div>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <User className="mr-1.5 h-3.5 w-3.5" />
                      {t(`customers.${customer.gender}`)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <DeleteCustomerDialog
        customer={customerToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
} 