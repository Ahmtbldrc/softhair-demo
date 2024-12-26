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

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceAdded: () => void;
}

export function AddServiceDialog({
  open,
  onOpenChange,
  onServiceAdded,
}: AddServiceDialogProps) {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !selectedBranchId) return;

    setIsLoading(true);
    try {
      await createService({
        name,
        price: Number(price),
        status: true,
        branchId: parseInt(selectedBranchId),
      });

      onServiceAdded();
      onOpenChange(false);
      setName("");
      setPrice("");
      toast({
        title: t("services.addSuccess"),
        description: t("services.addSuccessDescription"),
      });
    } catch (error) {
      console.error("Error adding service:", error);
      toast({
        title: t("services.addError"),
        description: t("services.addErrorDescription"),
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
              {t("services.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 