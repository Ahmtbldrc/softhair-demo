"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { Database } from "@/lib/database.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

interface DeleteCustomerDialogProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteCustomerDialog({
  customer,
  isOpen,
  onClose,
  onConfirm,
}: DeleteCustomerDialogProps) {
  const { t } = useLocale();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("customers.deleteCustomer")}</DialogTitle>
          <DialogDescription>
            {t("customers.confirmDelete")} {customer?.name} {customer?.surname}?
            <br />
            {t("customers.deleteWarning")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("customers.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("customers.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 