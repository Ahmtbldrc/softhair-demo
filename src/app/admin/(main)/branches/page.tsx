'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search, MoreVertical, Pencil, Trash2, DoorOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Branch } from "@/lib/types"
import { getAllBranches, createBranch, updateBranch, deleteBranch } from "@/lib/services/branch.service"
import { useLocale } from "@/contexts/LocaleContext"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useBranch } from "@/contexts/BranchContext"

export default function BranchesPage() {
  const { t } = useLocale()
  const router = useRouter()
  const { selectedBranchId: contextSelectedBranchId } = useBranch()
  const [searchTerm, setSearchTerm] = useState("")
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null)
  const [editedName, setEditedName] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newBranchName, setNewBranchName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const fetchBranches = async () => {
      setIsLoading(true);
      try {
        const data = await getAllBranches();
        setBranches(data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleEditClick = (branch: Branch) => {
    setBranchToEdit(branch)
    setEditedName(branch.name)
  }

  const handleConfirmEdit = async () => {
    if (branchToEdit && editedName.trim()) {
      setIsLoading(true);
      try {
        const success = await updateBranch(branchToEdit.id, editedName);
        
        if (!success) {
          toast({
            title: "Error",
            description: "Failed to update branch",
            variant: "destructive"
          });
          return;
        }

        setBranches(prev => prev.map(branch => 
          branch.id === branchToEdit.id 
            ? { ...branch, name: editedName.trim() }
            : branch
        ));

        toast({
          title: "Success",
          description: "Branch updated successfully",
          variant: "default"
        });
        setBranchToEdit(null);
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleDeleteClick = (branch: Branch) => {
    setBranchToDelete(branch)
  }

  const handleConfirmDelete = async () => {
    if (branchToDelete) {
      setIsLoading(true);
      try {
        const success = await deleteBranch(branchToDelete.id);

        if (!success) {
          toast({
            title: "Error",
            description: "Failed to delete branch",
            variant: "destructive"
          });
          return;
        }

        setBranches(prev => prev.filter(branch => branch.id !== branchToDelete.id));
        toast({
          title: "Success",
          description: "Branch deleted successfully",
          variant: "default"
        });
        setBranchToDelete(null);
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleAddBranch = async () => {
    if (!newBranchName.trim()) {
      toast({
        title: "Error",
        description: "Branch name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const newBranch = await createBranch(newBranchName);

      if (!newBranch) {
        toast({
          title: "Error",
          description: "Failed to add branch",
          variant: "destructive"
        });
        return;
      }

      setBranches(prev => [...prev, newBranch]);
      setNewBranchName("");
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Branch added successfully",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleBranchClick = async (branchId: number) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { selectedBranchId: branchId }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to select branch",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Branch selected successfully",
        variant: "default"
      });

      router.push("/admin");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="container mx-auto p-4 space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{t('branches.title')}</h1>
            <Button 
              className="transition-all hover:scale-105"
              onClick={() => setIsAddDialogOpen(true)}
              disabled={isLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('branches.addNew')}
            </Button>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('branches.search')}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-[1400px] mx-auto">
            {filteredBranches.map((branch) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[300px] mx-auto"
              >
                <Card className={`p-6 relative h-80 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 ${
                  contextSelectedBranchId === branch.id.toString()
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/20'
                }`}>
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleEditClick(branch)}
                          className="cursor-pointer"
                          disabled={isLoading}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>{t('common.edit')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(branch)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                          disabled={isLoading}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{t('common.delete')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-col h-full">
                    <h3 className={`text-xl font-semibold ${
                      contextSelectedBranchId === branch.id.toString()
                        ? 'text-primary' 
                        : 'text-gray-600 group-hover:text-primary'
                    } transition-colors`}>
                      {branch.name}
                    </h3>
                  </div>

                  <div className="absolute bottom-4 right-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleBranchClick(branch.id)}
                      disabled={isLoading}
                      className="opacity-70 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="flex items-center gap-2">
                        {t('branches.goto')}
                        <DoorOpen className="h-4 w-4" />
                      </span>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredBranches.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              {t('branches.noResults')}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('branches.addNewTitle')}</DialogTitle>
            <DialogDescription>
              {t('branches.addNewDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newBranchName">{t('branches.name')}</Label>
              <Input
                id="newBranchName"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder={t('branches.namePlaceholder')}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setNewBranchName("")
              }}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddBranch}
              disabled={!newBranchName.trim() || isLoading}
            >
              {t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!branchToEdit} onOpenChange={() => setBranchToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('branches.editTitle')}</DialogTitle>
            <DialogDescription>
              {t('branches.editDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('branches.name')}</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder={t('branches.namePlaceholder')}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBranchToEdit(null)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirmEdit}
              disabled={!editedName.trim() || editedName === branchToEdit?.name || isLoading}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!branchToDelete} onOpenChange={() => setBranchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{branchToDelete?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('branches.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
  