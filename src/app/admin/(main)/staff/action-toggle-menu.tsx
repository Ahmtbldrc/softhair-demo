import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { StaffWithServices } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

type Props = {
  staff: StaffWithServices,
  handleDelete: () => Promise<void>;
};

function ActionToggleMenu({ staff,  handleDelete }: Props) {
  const { t } = useLocale();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState<boolean>(false);

  const handleSubmitDelete = async () => {
    setIsDeleting(true);
    await handleDelete();
    const {error} = await supabase.auth.admin.deleteUser(staff.userId);

    if (error)
      console.log(error);

    if (staff.image) {
      const {error: storageError} = await supabase.storage.from("staff").remove([staff.image])
      
      if (storageError)
        console.log(storageError);
    }
      
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    toast({
        title: "Successful!",
        description: "Staff deleted successfully"
    });
  };

  return (
    <DropdownMenu open={isDeleteDialogOpen ? isDeleteDialogOpen : isDropdownMenuOpen} onOpenChange={setIsDropdownMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button aria-haspopup="true" size="icon" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t("admin-staff.toggleMenu")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("admin-staff.actions")}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/admin/staff/edit/${staff.id}`}>{t("admin-staff.edit")}</Link>
        </DropdownMenuItem>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem>{t("admin-staff.delete")}</DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
            <DialogTitle>{t("admin-staff.areYouSure")}</DialogTitle>
              <DialogDescription>
                {t("admin-staff.thisActionCannotBeUndone")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                {t("admin-staff.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleSubmitDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("admin-staff.deleteStaff")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ActionToggleMenu;
