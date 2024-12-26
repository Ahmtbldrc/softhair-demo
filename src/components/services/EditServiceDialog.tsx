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
import { Service } from "@/lib/types";
import { updateService } from "@/lib/services/service.service";
import { toast } from "@/hooks/use-toast";

interface EditServiceDialogProps {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceUpdated: () => void;
}

export function EditServiceDialog({
  service,
  open,
  onOpenChange,
  onServiceUpdated,
}: EditServiceDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState(service.price.toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    setIsLoading(true);
    try {
      await updateService(service.id, {
        name,
        price: Number(price),
      });

      onServiceUpdated();
      onOpenChange(false);
      toast({
        title: t("services.editSuccess"),
        description: t("services.editSuccessDescription"),
      });
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        title: t("services.editError"),
        description: t("services.editErrorDescription"),
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
          <DialogTitle>{t("services.editTitle")}</DialogTitle>
          <DialogDescription>
            {t("services.editDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">
                {t("services.name")}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("services.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 