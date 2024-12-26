'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search, DoorOpen, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
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

// Örnek şube verisi
const DUMMY_BRANCHES = [
  { id: 1, name: "Kadıköy Şubesi", activeAppointments: 3 },
  { id: 2, name: "Beşiktaş Şubesi", activeAppointments: 5 },
  { id: 3, name: "Şişli Şubesi", activeAppointments: 2 },
  { id: 4, name: "Bakırköy Şubesi", activeAppointments: 4 },
]

export default function BranchesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState<number | null>(null)
  const [branches, setBranches] = useState(DUMMY_BRANCHES)
  const [branchToDelete, setBranchToDelete] = useState<{ id: number, name: string } | null>(null)
  const [branchToEdit, setBranchToEdit] = useState<{ id: number, name: string } | null>(null)
  const [editedName, setEditedName] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newBranchName, setNewBranchName] = useState("")

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBranchClick = async (branchId: number) => {
    setIsLoading(branchId)
    
    for(let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsLoading(null)
  }

  const handleEditClick = (branch: { id: number, name: string }) => {
    setBranchToEdit(branch)
    setEditedName(branch.name)
  }

  const handleConfirmEdit = () => {
    if (branchToEdit && editedName.trim()) {
      setBranches(prev => prev.map(branch => 
        branch.id === branchToEdit.id 
          ? { ...branch, name: editedName.trim() }
          : branch
      ))
      toast({
        title: "Başarılı",
        description: "Şube bilgileri güncellendi",
        variant: "default"
      })
      setBranchToEdit(null)
    }
  }

  const handleDeleteClick = (branch: { id: number, name: string }) => {
    setBranchToDelete(branch)
  }

  const handleConfirmDelete = () => {
    if (branchToDelete) {
      setBranches(prev => prev.filter(branch => branch.id !== branchToDelete.id))
      toast({
        title: "Başarılı",
        description: "Şube başarıyla silindi",
        variant: "default"
      })
      setBranchToDelete(null)
    }
  }

  const handleAddBranch = () => {
    if (!newBranchName.trim()) {
      toast({
        title: "Hata",
        description: "Şube adı boş olamaz",
        variant: "destructive"
      })
      return
    }

    const newBranch = {
      id: Math.max(...branches.map(b => b.id)) + 1,
      name: newBranchName.trim(),
      activeAppointments: 0
    }

    setBranches(prev => [...prev, newBranch])
    setNewBranchName("")
    setIsAddDialogOpen(false)
    toast({
      title: "Başarılı",
      description: "Yeni şube başarıyla eklendi",
      variant: "default"
    })
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="container mx-auto p-4 space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Şubeler</h1>
            <Button 
              className="transition-all hover:scale-105"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Şube Ekle
            </Button>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Şube ara..."
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
                <Card className="p-6 relative h-80 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/20">
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
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Düzenle</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(branch)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Sil</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-col h-full">
                    <h3 className="text-xl font-semibold text-gray-600 group-hover:text-primary transition-colors">
                      {branch.name}
                    </h3>
                    
                    {branch.activeAppointments > 0 && (
                      <div className="mt-4 text-sm flex items-center gap-1 text-green-500 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span>
                          {branch.activeAppointments} yeni bildirim
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute bottom-4 right-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleBranchClick(branch.id)}
                      className="opacity-70 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="flex items-center gap-2">
                        şubeye git
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
              Aranan kriterlere uygun şube bulunamadı.
            </div>
          )}
        </div>
      </main>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Şube Ekle</DialogTitle>
            <DialogDescription>
              Yeni şube bilgilerini giriniz.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newBranchName">Şube Adı</Label>
              <Input
                id="newBranchName"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="Şube adını giriniz"
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
            >
              İptal
            </Button>
            <Button
              onClick={handleAddBranch}
              disabled={!newBranchName.trim()}
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!branchToEdit} onOpenChange={() => setBranchToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şube Düzenle</DialogTitle>
            <DialogDescription>
              Şube bilgilerini güncelleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Şube Adı</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Şube adını giriniz"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBranchToEdit(null)}
            >
              İptal
            </Button>
            <Button
              onClick={handleConfirmEdit}
              disabled={!editedName.trim() || editedName === branchToEdit?.name}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!branchToDelete} onOpenChange={() => setBranchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{branchToDelete?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Bu şubeyi silmek istediğinizden emin misiniz? Silinen şubelerin dataları ve kullanıcıları da kalıcı olarak silinmektedir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
  
