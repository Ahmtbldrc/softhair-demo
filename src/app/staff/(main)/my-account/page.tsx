'use client'

import { useEffect, useState } from 'react'
import Image from "next/image"
import { ChevronLeft, Upload, Plus, X, CloudUpload, Loader2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ServiceType, StaffType, TimeSlot, WeeklyHours } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

const staffData: StaffType = {
  id: 0,
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "********",
  userId: "",
  status: true,
  image: "",
  services: [],
  weeklyHours: {
    SUN: [],
    MON: [],
    TUE: [],
    WED: [],
    THU: [],
    FRI: [],
    SAT: [],
  }
}

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffType>(staffData)
  const [staffImageName, setStaffImageName] = useState<string>("")
  const [staffImage, setStaffImage] = useState<File | null>(null)
  const [services, setServices] = useState<{ id: number; name: string }[]>()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [currentUsername, setCurrentUsername] = useState<string>("")
  const [selectedServices, setSelectedServices] = useState<number[]>([])

  const router = useRouter()

  const handleServiceChange = (serviceId: number) => {
    setSelectedServices(prevSelectedServices =>
      prevSelectedServices.includes(serviceId)
        ? prevSelectedServices.filter(id => id !== serviceId)
        : [...prevSelectedServices, serviceId]
    )
  }

  const handleWeeklyHoursChange = (day: keyof WeeklyHours, index: number, field: keyof TimeSlot, value: string) => {
    setStaff(prev => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: prev.weeklyHours[day].map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }

  const addTimeSlot = (day: keyof WeeklyHours) => {
    setStaff(prev => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: [...prev.weeklyHours[day], { start: "09:00", end: "17:00" }]
      }
    }))
  }

  const removeTimeSlot = (day: keyof WeeklyHours, index: number) => {
    setStaff(prev => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: prev.weeklyHours[day].filter((_, i) => i !== index)
      }
    }))
  }

  const handleUploadStaffImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const objectUrl = URL.createObjectURL(file)

      setStaffImageName(objectUrl)
      setStaffImage(file)

      const fileExtension = e.target.files[0]?.name.split(".").pop()
      const fileName = `${staff.firstName.toLowerCase()}-${staff.lastName.toLowerCase()}.${fileExtension}`

      staff.image = fileName
      setStaff(staff)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
  
    if (currentUsername !== staff.username) {
      const { data: existUser } = await supabase
        .from("staff")
        .select("*")
        .eq("username", staff.username)
  
      if (existUser?.length) {
        toast({
          title: "Error!",
          description: `User already exists (${staff.username})`,
        })
        setIsSubmitting(false)
        return
      }
    }
  
    const { error } = await supabase
      .from("staff")
      .update({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        username: staff.username,
        password: staff.password,
        status: staff.status,
        image: staff.image,
        weeklyHours: staff.weeklyHours,
      })
      .eq("id", staff.id)
  
    if (error) {
      toast({
        title: "error",
        description: "Error adding staff member",
      })
      setIsSubmitting(false)
      return
    }
  
    const { data: existingItems } = await supabase
      .from("staff_services")
      .select("service_id")
      .eq("staff_id", staff.id)
  
    const existingIds = existingItems?.map((item) => item.service_id)
  
    const toAdd = selectedServices.filter((id) => !existingIds?.includes(id))
    const toDelete = existingIds!.filter((id) => !selectedServices.includes(id))
  
    if (toAdd.length > 0) {
      const { error: toAddError } = await supabase
        .from("staff_services")
        .insert(toAdd.map((service_id) => ({ staff_id: staff.id, service_id })))
  
      if (toAddError) {
        console.error(toAddError)
      }
    }
  
    if (toDelete.length > 0) {
      const { error: toDeleteError } = await supabase
        .from("staff_services")
        .delete()
        .in("service_id", toDelete)
        .eq("staff_id", staff.id)
  
      if (toDeleteError) {
        console.error(toDeleteError)
      }
    }
  
    if (staffImage != null) {
      await supabase.storage
        .from("staff")
        .upload(staff.image, staffImage as File,  {
          cacheControl: '3600',
          upsert: true
        })
    }
  
    const { error: authError } = await supabase.auth.admin.updateUserById(
      staff.userId,
      {
        email: `${staff.username.toLowerCase()}@softsidedigital.com`,
        password: staff.password,
        user_metadata: {
          fullName: `${staff.firstName} ${staff.lastName}`,
          username: staff.username,
          email: staff.email
        },
      }
    )
  
    if (authError) {
      console.error(authError)
    }

    router.push("/staff")
  
    toast({
      title: "Success",
      description: "Account updated successfully",
    })
  
    setIsSubmitting(false)
  }

  useEffect(() => {
    fetchServices()
    fetchStaff()
  }, [])

  const fetchServices = async () => {
    await supabase
    .from("services")
    .select("*")
    .then(({ data, error }) => {
      if (error) {
        console.log("error", error)
      } else {
        setServices(data)
      }
    })
  }

  const fetchStaff = async () => {
    const { data: { session } } = await supabase.auth.getSession()

   await supabase
    .from("staff")
    .select("*, services:staff_services(service:service_id(id, name))")
    .eq("id", session?.user.user_metadata.staffId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error(error)
      } else {
        setStaff(data)
        setCurrentUsername(data?.username)
        setSelectedServices(data?.services.map((s: ServiceType) => s.service.id))
     }
    })
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 max-[640px]:p-2">
        <div className="mx-auto grid max-w-[59rem] min-[640px]:flex-1 auto-rows-max gap-4 max-[640px]:p-2">
          <div className="flex items-center gap-4">
            <Link href="/staff">
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            </Link>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              {`${staff.firstName} ${staff.lastName}`}
            </h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Details</CardTitle>
                    <CardDescription>
                      Enter the staff member's personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            type="text"
                            className="w-full"
                            value={staff.firstName}
                            onChange={(e) =>
                              setStaff({ ...staff, firstName: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            type="text"
                            className="w-full"
                            value={staff.lastName}
                            onChange={(e) =>
                              setStaff({ ...staff, lastName: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          className="w-full"
                          value={staff.email}
                          onChange={(e) =>
                            setStaff({ ...staff, email: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          className="w-full"
                          value={staff.username}
                          onChange={(e) =>
                            setStaff({ ...staff, username: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          className="w-full"
                          value={staff.password}
                          onChange={(e) =>
                            setStaff({ ...staff, password: e.target.value })
                          }
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Hours</CardTitle>
                    <CardDescription>
                      Set the staff member's weekly working hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Day</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {daysOfWeek.map((day) => (
                            <TableRow key={day}>
                              <TableCell className="font-medium">{day}</TableCell>
                              <TableCell>
                                {staff.weeklyHours[day].length === 0 ? (
                                  <span className="text-muted-foreground">
                                    Unavailable
                                  </span>
                                ) : (
                                  <div className="flex flex-col space-y-2">
                                    {staff.weeklyHours[day].map((slot, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                      >
                                        <Input
                                          type="time"
                                          value={slot.start}
                                          onChange={(e) =>
                                            handleWeeklyHoursChange(
                                              day,
                                              index,
                                              "start",
                                              e.target.value
                                            )
                                          }
                                          className="w-24"
                                        />
                                        <span>-</span>
                                        <Input
                                          type="time"
                                          value={slot.end}
                                          onChange={(e) =>
                                            handleWeeklyHoursChange(
                                              day,
                                              index,
                                              "end",
                                              
                                              e.target.value
                                            )
                                          }
                                          className="w-24"
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeTimeSlot(day, index)}
                                        >
                                          <X className="h-4 w-4" />
                                          <span className="sr-only">Remove time slot</span>
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addTimeSlot(day)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="sm:hidden">
                      {daysOfWeek.map((day) => (
                        <Popover key={day}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start mb-2">
                              <Clock className="mr-2 h-4 w-4" />
                              {day}
                              <span className="ml-auto">
                                {staff.weeklyHours[day].length === 0
                                  ? "Unavailable"
                                  : `${staff.weeklyHours[day].length} slot(s)`}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              {staff.weeklyHours[day].map((slot, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Input
                                    type="time"
                                    value={slot.start}
                                    onChange={(e) =>
                                      handleWeeklyHoursChange(
                                        day,
                                        index,
                                        "start",
                                        e.target.value
                                      )
                                    }
                                    className="w-24"
                                  />
                                  <span>-</span>
                                  <Input
                                    type="time"
                                    value={slot.end}
                                    onChange={(e) =>
                                      handleWeeklyHoursChange(
                                        day,
                                        index,
                                        "end",
                                        e.target.value
                                      )
                                    }
                                    className="w-24"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeTimeSlot(day, index)}
                                  >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Remove time slot</span>
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addTimeSlot(day)}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Time Slot
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={staff.status ? "true" : "false"}
                      onValueChange={(value: string) =>
                        setStaff({ ...staff, status: value === "true" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Passive</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Staff Image</CardTitle>
                    <CardDescription>
                      Upload a profile image for the staff member
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="aspect-square w-full overflow-hidden rounded-md">
                        {staff.image ? (
                          <Image
                            alt="Staff image"
                            className="aspect-square object-cover"
                            height={300}
                            src={staffImageName.length === 0 
                              ? `https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staff.image}` 
                              : staffImageName}
                            width={300}
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-muted">
                            <CloudUpload className="h-28 w-28 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <Label htmlFor="picture" className="cursor-pointer">
                          <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-2 hover:bg-muted/80">
                            <Upload className="h-4 w-4" />
                            <span>Upload Image</span>
                          </div>
                          <Input
                            id="picture"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleUploadStaffImage(e)}
                          />
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Services</CardTitle>
                    <CardDescription>
                      Select the services this staff member can provide
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {services?.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={service.id.toString()}
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => handleServiceChange(service.id)}
                          /> 
                          <label
                            htmlFor={service.id.toString()}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {service.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button type="button" variant="outline">
                Discard
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}