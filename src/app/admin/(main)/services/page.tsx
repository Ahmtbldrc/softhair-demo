"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Service {
  id: number;
  name: string;
  price: number;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);

  const getServices = async () => {
    const { data, error } = await supabase.from("services").select("*");
    console.log(data);
    return data;
  };

  useEffect(() => {
    getServices().then((data) => {
      setServices(data as Service[]);
      console.log(data);
    });
  }, []);

  const [newService, setNewService] = useState<Omit<Service, "id">>({
    name: "",
    price: 0,
  });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddService = () => {
    if (!newService.name || newService.price <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid name and price.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setTimeout(async () => {

      const { error } = await supabase
      .from('services')
      .insert({ price: newService.price, name: newService.name });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    
      setServices([
        ...services,
        {
          ...newService,
          id: Date.now(),
          price: Number(newService.price.toFixed(2)),
        },
      ]);
      setNewService({ name: "", price: 0 });
      setIsAddDialogOpen(false);
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Service added successfully.",
      });
    }, 500); // Simulating API call
  };

  const handleEditService = () => {
    if (editingService && editingService.price > 0) {
      setIsLoading(true);
      setTimeout(async () => {
        const { error } = await supabase
          .from("services")
          .update({ price: editingService.price })
          .eq("id", editingService.id);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        setServices(
          services.map((service) =>
            service.id === editingService.id
              ? {
                  ...editingService,
                  price: Number(editingService.price.toFixed(2)),
                }
              : service
          )
        );
        setEditingService(null);
        setIsEditDialogOpen(false);
        setIsLoading(false);
        toast({
          title: "Success",
          description: "Service updated successfully.",
        });
      }, 500); // Simulating API call
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = () => {
    if (serviceToDelete) {
      setIsLoading(true);
      setTimeout(async () => {
        const response = await supabase.from("services").delete().eq("id", serviceToDelete.id);
        if (response.error) {
          toast({
            title: "Error",
            description: response.error.message,
            variant: "destructive",
          });
          return;
        }

        setServices(
          services.filter((service) => service.id !== serviceToDelete.id)
        );
        setServiceToDelete(null);
        setIsDeleteDialogOpen(false);
        setIsLoading(false);
        toast({
          title: "Success",
          description: "Service deleted successfully.",
        });
      }, 500); // Simulating API call
    }
  };
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="container mx-auto p-4 space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">
              Services Management
            </h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new service below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newService.name}
                      onChange={(e) =>
                        setNewService({ ...newService, name: e.target.value })
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Price
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter price"
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          price: Number(e.target.value),
                        })
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddService} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Add Service
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Name</TableHead>
                  <TableHead className="w-[30%]">Price</TableHead>
                  <TableHead className="w-[30%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow
                    key={service.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {service.name}
                    </TableCell>
                    <TableCell>${service.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog
                          open={isEditDialogOpen}
                          onOpenChange={setIsEditDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingService(service)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">
                                Edit {service.name}
                              </span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Service</DialogTitle>
                              <DialogDescription>
                                Make changes to the service price below.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                  htmlFor="edit-name"
                                  className="text-right"
                                >
                                  Name
                                </Label>
                                <Input
                                  id="edit-name"
                                  value={editingService?.name}
                                  className="col-span-3 bg-muted text-muted-foreground"
                                  readOnly
                                  disabled
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                  htmlFor="edit-price"
                                  className="text-right"
                                >
                                  Price
                                </Label>
                                <Input
                                  id="edit-price"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Enter new price"
                                  value={editingService?.price}
                                  onChange={(e) =>
                                    setEditingService(
                                      editingService
                                        ? {
                                            ...editingService,
                                            price: Number(e.target.value),
                                          }
                                        : null
                                    )
                                  }
                                  className="col-span-3"
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleEditService}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog
                          open={isDeleteDialogOpen}
                          onOpenChange={setIsDeleteDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setServiceToDelete(service)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">
                                Delete {service.name}
                              </span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Deletion</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete the service "
                                {serviceToDelete?.name}"? This action cannot be
                                undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsDeleteDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteService}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
