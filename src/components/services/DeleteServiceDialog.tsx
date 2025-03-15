"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { deleteService } from "@/lib/services/service.service";
import { toast } from "@/hooks/use-toast";
import { Service } from "@/lib/types";

interface DeleteServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceDeleted: () => void;
  service: Service;
}

export function DeleteServiceDialog({
  open,
  onOpenChange,
  onServiceDeleted,
  service,
}: DeleteServiceDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteService(service.id);

      if (result.error) {
        throw new Error(result.error);
      }

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
        description: error instanceof Error ? error.message : t("services.deleteErrorDescription"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("services.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("services.deleteDescription", { name: service.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("services.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 