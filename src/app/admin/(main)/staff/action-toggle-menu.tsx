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
import { StaffType } from "@/lib/types";

type Props = {
  staff: StaffType,
  handleDelete: () => Promise<void>;
};

function ActionToggleMenu({ staff,  handleDelete }: Props) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState<boolean>(false);

  const handleSubmitDelete = async () => {
    setIsDeleting(true);
    await handleDelete();
    const {error} = await supabase.auth.admin.deleteUser(staff.userId);

    if (error)
      console.log(error);

    const {error: storageError} = await supabase.storage.from("staff").remove([staff.image])
    
    if (storageError)
      console.log(storageError);
      
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
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/admin/staff/edit/${staff.id}`}>Edit</Link>
        </DropdownMenuItem>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                staff member and remove their data from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleSubmitDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ActionToggleMenu;
