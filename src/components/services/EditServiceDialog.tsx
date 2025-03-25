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
import { updateService } from "@/lib/services/service.service";
import { toast } from "@/hooks/use-toast";
import { Service } from "@/lib/types";
import { serviceSchema } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  const [durationValue, setDurationValue] = useState(service.duration ?? 30);

  const form = useForm<FormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service.name ?? "",
      price: service.price ?? 0,
      status: service.status ?? true,
      branchId: service.branchId ?? 0,
      duration: service.duration ?? 30
    }
  });

  useEffect(() => {
    if (open) {
      const duration = service.duration ?? 30;
      setDurationValue(duration);
      form.reset({
        name: service.name ?? "",
        price: service.price ?? 0,
        status: service.status ?? true,
        branchId: service.branchId ?? 0,
        duration: duration
      });
    }
  }, [open, service, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      const result = await updateService(service.id, {
        name: data.name ?? "",
        price: data.price ?? 0,
        duration: data.duration
      });

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
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={!form.formState.isValid || form.formState.isSubmitting}
              className="w-full sm:w-auto"
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("services.update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 