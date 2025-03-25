"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Service } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";
import { EditServiceDialog } from "@/components/services/EditServiceDialog"
import { DeleteServiceDialog } from "@/components/services/DeleteServiceDialog";

interface ServiceCardProps {
  service: Service;
  onUpdate: () => void;
}

export function ServiceCard({ service, onUpdate }: ServiceCardProps) {
  const { t } = useLocale();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold">{service.name}</h3>
          <p className="text-2xl font-bold mt-2">{service.price?.toFixed(2) ?? "0.00"} €</p>
        </CardContent>
        <CardFooter className="justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">{t("services.edit")} {service.name}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{t("services.delete")} {service.name}</span>
          </Button>
        </CardFooter>
      </Card>

      <EditServiceDialog
        service={service}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onServiceUpdated={onUpdate}
      />

      <DeleteServiceDialog
        service={service}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onServiceDeleted={onUpdate}
      />
    </>
  );
} 