"use client";

import { useEffect, useState } from "react";
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
import { updateService, getActiveServices } from "@/lib/services/service.service";
import { toast } from "@/hooks/use-toast";
import { Service } from "@/lib/types";
import { serviceSchema } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useBranch } from "@/contexts/BranchContext";

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceUpdated: () => void;
  service: Service;
}

type FormData = z.infer<typeof serviceSchema>;

export function EditServiceDialog({
  open,
  onOpenChange,
  onServiceUpdated,
  service,
}: EditServiceDialogProps) {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();
  const [durationValue, setDurationValue] = useState(service.duration ?? 30);
  const [isServiceGroup, setIsServiceGroup] = useState(!!service.subServiceIds?.length);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedSubServices, setSelectedSubServices] = useState<number[]>(service.subServiceIds ?? []);

  const form = useForm<FormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service.name ?? "",
      price: service.price ?? 0,
      status: service.status ?? true,
      branchId: service.branchId ?? 0,
      duration: service.duration ?? 30,
      subServiceIds: service.subServiceIds ?? null
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

  useEffect(() => {
    if (open) {
      const duration = service.duration ?? 30;
      setDurationValue(duration);
      setIsServiceGroup(!!service.subServiceIds?.length);
      setSelectedSubServices(service.subServiceIds ?? []);
      form.reset({
        name: service.name ?? "",
        price: service.price ?? 0,
        status: service.status ?? true,
        branchId: service.branchId ?? 0,
        duration: duration,
        subServiceIds: service.subServiceIds ?? null
      });
    }
  }, [open, service, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      const serviceData = {
        ...data,
        subServiceIds: isServiceGroup ? selectedSubServices : null,
        duration: isServiceGroup 
          ? selectedSubServices.reduce((total, id) => {
              const service = availableServices.find(s => s.id === id);
              return total + (service?.duration || 0);
            }, 0)
          : data.duration
      };

      const result = await updateService(service.id, serviceData);

      if (result.error) {
        throw new Error(result.error);
      }

      onServiceUpdated();
      onOpenChange(false);
      toast({
        title: t("services.updateSuccess"),
        description: t("services.updateSuccessDescription"),
      });
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        title: t("services.updateError"),
        description: error instanceof Error ? error.message : t("services.updateErrorDescription"),
        variant: "destructive",
      });
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
          <DialogTitle>{t("services.editTitle")}</DialogTitle>
          <DialogDescription>
            {t("services.editDescription")}
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
              disabled={!form.formState.isValid || (isServiceGroup && selectedSubServices.length === 0)}
              className="w-full sm:w-auto"
            >
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("services.update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 