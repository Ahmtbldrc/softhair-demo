"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useBranch } from "@/contexts/BranchContext";
import { createService, getActiveServices } from "@/lib/services/service.service";
import { toast } from "@/hooks/use-toast";
import { serviceSchema } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Service } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceAdded: () => void;
}

type FormData = z.infer<typeof serviceSchema>;

export function AddServiceDialog({
  open,
  onOpenChange,
  onServiceAdded,
}: AddServiceDialogProps) {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [durationValue, setDurationValue] = useState(30);
  const [isServiceGroup, setIsServiceGroup] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedSubServices, setSelectedSubServices] = useState<number[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      price: 0,
      status: true,
      branchId: selectedBranchId ? selectedBranchId : 0,
      duration: 30,
      isServiceGroup: false,
      subServiceIds: null
    }
  });

  useEffect(() => {
    if (open && selectedBranchId) {
      fetchAvailableServices();
    }
  }, [open, selectedBranchId]);

  const fetchAvailableServices = async () => {
    try {
      const result = await getActiveServices(selectedBranchId);
      if (result.error) {
        throw new Error(result.error);
      }
      setAvailableServices(result.data as Service[]);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleSubmit = async (data: FormData) => {
    if (!selectedBranchId) return;

    setIsLoading(true);
    try {
      const serviceData = {
        ...data,
        branchId: selectedBranchId,
        subServiceIds: isServiceGroup ? selectedSubServices : null,
        duration: isServiceGroup 
          ? selectedSubServices.reduce((total, id) => {
              const service = availableServices.find(s => s.id === id);
              return total + (service?.duration || 0);
            }, 0)
          : data.duration
      };

      const result = await createService(serviceData);

      if (result.error) {
        throw new Error(result.error);
      }

      onServiceAdded();
      onOpenChange(false);
      form.reset();
      setIsServiceGroup(false);
      setSelectedSubServices([]);
      toast({
        title: t("services.addSuccess"),
        description: t("services.addSuccessDescription"),
      });
    } catch (error) {
      console.error("Error adding service:", error);
      toast({
        title: t("services.addError"),
        description: error instanceof Error ? error.message : t("services.addErrorDescription"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDurationChange = (value: number[]) => {
    const duration = value[0];
    setDurationValue(duration);
    form.setValue("duration", duration, { shouldValidate: true });
  };

  const handleServiceGroupToggle = (checked: boolean) => {
    setIsServiceGroup(checked);
    if (!checked) {
      setSelectedSubServices([]);
      form.setValue("subServiceIds", null);
    }
  };

  const handleSubServiceChange = (serviceId: number, checked: boolean) => {
    setSelectedSubServices(prev => 
      checked 
        ? [...prev, serviceId]
        : prev.filter(id => id !== serviceId)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("services.addNewTitle")}</DialogTitle>
          <DialogDescription>
            {t("services.addNewDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">
                {t("services.name")}
              </Label>
              <Input
                id="name"
                {...form.register("name")}
                aria-invalid={!!form.formState.errors.name}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isServiceGroup"
                checked={isServiceGroup}
                onCheckedChange={handleServiceGroupToggle}
              />
              <Label htmlFor="isServiceGroup">
                {t("services.isServiceGroup")}
              </Label>
            </div>

            {isServiceGroup ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("services.selectSubServices")}</Label>
                  <div className="max-h-[200px] overflow-y-auto border rounded-md p-2">
                    {availableServices.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2 p-2">
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={selectedSubServices.includes(service.id)}
                          onCheckedChange={(checked) => 
                            handleSubServiceChange(service.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={`service-${service.id}`} className="flex-1">
                          {service.name} ({service.duration} {t("services.minutes")})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="price">
                    {t("services.price")}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("price", { valueAsNumber: true })}
                    aria-invalid={!!form.formState.errors.price}
                  />
                  {form.formState.errors.price && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label>
                    {t("services.totalDuration")}: {selectedSubServices.reduce((total, id) => {
                      const service = availableServices.find(s => s.id === id);
                      return total + (service?.duration || 0);
                    }, 0)} {t("services.minutes")}
                  </Label>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="price">
                    {t("services.price")}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("price", { valueAsNumber: true })}
                    aria-invalid={!!form.formState.errors.price}
                  />
                  {form.formState.errors.price && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="duration">
                    {t("services.duration")} - {durationValue} {t("services.minutes")}
                  </Label>
                  <Slider
                    id="duration"
                    min={5}
                    max={180}
                    step={5}
                    value={[durationValue]}
                    onValueChange={handleDurationChange}
                    className="py-4"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !form.formState.isValid || (isServiceGroup && selectedSubServices.length === 0)} 
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("services.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}