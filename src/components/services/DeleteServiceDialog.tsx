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
import { Loader2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Service } from "@/lib/types";
import { deleteService } from "@/lib/services/service.service";
import { toast } from "@/hooks/use-toast";

interface DeleteServiceDialogProps {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceDeleted: () => void;
}

export function DeleteServiceDialog({
  service,
  open,
  onOpenChange,
  onServiceDeleted,
}: DeleteServiceDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteService(service.id);
      onServiceDeleted();
      onOpenChange(false);
      toast({
        title: t("services.deleteSuccess"),
        description: t("services.deleteSuccessDescription"),
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: t("services.deleteError"),
        description: t("services.deleteErrorDescription"),
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
          <DialogTitle>{t("services.deleteTitle")}</DialogTitle>
          <DialogDescription>
            {t("services.deleteDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm font-medium mb-1">{t("services.name")}</p>
          <p className="text-base">{service.name}</p>
          <p className="text-sm font-medium mt-4 mb-1">{t("services.price")}</p>
          <p className="text-base">{service.price.toFixed(2)} CHF</p>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 