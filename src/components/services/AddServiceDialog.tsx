"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useBranch } from "@/contexts/BranchContext";
import { createService } from "@/lib/services/service.service";
import { toast } from "@/hooks/use-toast";
import { serviceSchema } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

  const form = useForm<FormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      price: 0,
      status: true,
      branchId: selectedBranchId ? selectedBranchId : 0
    }
  });

  const handleSubmit = async (data: FormData) => {
    if (!selectedBranchId) return;

    setIsLoading(true);
    try {
      const result = await createService({
        ...data,
        duration: 30,
        branchId: selectedBranchId
      });

      if (result.error) {
        throw new Error(result.error);
      }

      onServiceAdded();
      onOpenChange(false);
      form.reset();
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
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !form.formState.isValid} 
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