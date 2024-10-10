'use client'

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  PlusCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

const initialStaff = [
  {
    id: 1,
    username: "alex_cosacs",
    status: "Active",
    image: "/image/staff-1.png",
    services: ["Coloring", "Makeup", "Haircut"],
  },
  {
    id: 2,
    username: "maria_morais",
    status: "Active",
    image: "/image/staff-2.png",
    services:  ["Coloring", "Makeup"],
  },
  {
    id: 3,
    username: "aeron_shgray",
    status: "Active",
    image: "/image/staff-3.png",
    services:  ["Skincare", "Makeup"],
  },
  {
    id: 4,
    username: "heinz_hofmeister",
    status: "Passive",
    image: "/image/staff-4.png",
    services:  ["Haircut", "Hair Wash"],
  },
  {
    id: 5,
    username: "luna_lucia",
    status: "Active",
    image: "/image/staff-5.png",
    services:  ["Haircut", "Hair Wash", "Coloring"],
  },
  {
    id: 6,
    username: "marry_quill",
    status: "Passive",
    image: "/image/staff-6.png",
    services:  ["Coloring", "Makeup"],
  },
  {
    id: 7,
    username: "john_doe",
    status: "Active",
    image: "/image/staff-7.png",
    services:  ["Coloring", "Makeup"],
  },
  {
    id: 8,
    username: "jane_smith",
    status: "Active",
    image: "/image/staff-8.png",
    services:  ["Coloring", "Makeup"],
  },
]

export default function StaffPage() {
  const router = useRouter()
  const [filter, setFilter] = useState("all")
  const [staff, setStaff] = useState(initialStaff)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  const filteredStaff = staff.filter(member => 
    filter === "all" || member.status.toLowerCase() === filter.toLowerCase()
  )
  
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage)

  const handleDelete = (id: number) => {
    setStaff(staff.filter(member => member.id !== id))
  }

  const handleEdit = (id: number) => {
    router.push(`/admin/staff/edit/${id}`)
  }

  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="container mx-auto p-4 space-y-8">
          <Tabs defaultValue="all" onValueChange={(value) => { setFilter(value); setCurrentPage(1); }}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="passive">Passive</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Link href="/admin/staff/add">
                <Button size="sm" className="h-8">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
                </Link>
                
              </div>
            </div>
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Staff List</CardTitle>
                  <CardDescription>
                    Manage your Staff and view their services.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden w-[100px] sm:table-cell">
                          <span className="sr-only">Image</span>
                        </TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Services
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStaff.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="hidden sm:table-cell">
                            <Image
                              alt={`${member.username} image`}
                              className="aspect-square rounded-md object-cover"
                              height="64"
                              src={member.image}
                              width="64"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {member.username}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={member.status === "Active" ? "default" : "destructive"}
                              className={member.status === "Active" ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500"}
                            >
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {member.services.map((service, index) => (
                              <Badge key={index} variant="outline" className="mr-1 mb-1">
                                {service}
                              </Badge>
                            ))}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={() => handleEdit(member.id)}>
                                  Edit
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the
                                        staff member and remove their data from our servers.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(member.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <strong>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredStaff.length)}</strong> of <strong>{filteredStaff.length}</strong> staff members
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(prev => Math.max(prev - 1, 1));
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i + 1);
                            }}
                            isActive={currentPage === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}