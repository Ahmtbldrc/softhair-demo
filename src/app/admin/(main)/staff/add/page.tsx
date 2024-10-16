"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  Upload,
  Plus,
  X,
  CloudUpload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Roles, StaffType, TimeSlot, WeeklyHours } from "@/lib/types";

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

const emptyStaffData: StaffType = {
  id: 0,
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
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
  },
};

export default function AddStaff() {
  const [staff, setStaff] = useState<StaffType>(emptyStaffData);
  const [services, setServices] = useState<{ id: number; name: string }[]>();
  const [staffImageName, setStaffImageName] = useState<string>("");
  const [staffImage, setStaffImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    supabase
      .from("services")
      .select("*")
      .then(({ data, error }) => {
        if (error) {
          console.log("error", error);
        } else {
          setServices(data);
        }
      });
  }, []);

  const handleServiceChange = (service: { id: number; name: string }) => {
    const serviceIndex = staff.services.findIndex(
      (s) => s.service.name === service.name
    );
    if (serviceIndex === -1) {
      setStaff((prev) => ({
        ...prev,
        services: [...prev.services, { service }],
      }));
    } else {
      setStaff((prev) => ({
        ...prev,
        services: prev.services.filter((_, i) => i !== serviceIndex),
      }));
    }
  };

  const handleWeeklyHoursChange = (
    day: keyof WeeklyHours,
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    setStaff((prev) => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: prev.weeklyHours[day].map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const addTimeSlot = (day: keyof WeeklyHours) => {
    setStaff((prev) => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: [...prev.weeklyHours[day], { start: "09:00", end: "17:00" }],
      },
    }));
  };

  const removeTimeSlot = (day: keyof WeeklyHours, index: number) => {
    setStaff((prev) => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: prev.weeklyHours[day].filter((_, i) => i !== index),
      },
    }));
  };

  const handleUploadStaffImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setStaffImageName(objectUrl);
      setStaffImage(file);
      const fileExtension = e.target.files[0]?.name.split(".").pop();
      const fileName = `${staff.firstName.toLowerCase()}-${staff.lastName.toLowerCase()}.${fileExtension}`;
      staff.image = fileName;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { data: existUser } = await supabase
    .from("staff")
    .select("*")
    .eq("username", staff.username);

    if (existUser?.length){
      toast({
        title: "Error!",
        description: `User already exists (${staff.username})`
      })
      setIsSubmitting(false);
      return;
    }

    const { data:authData, error: authError } = await supabase.auth.admin.createUser({
      email: `${staff.username.toLowerCase()}@softsidedigital.com`,
      password: staff.password,
      role: Roles.STAFF,
      email_confirm: false,
      user_metadata: {
        fullName: `${staff.firstName} ${staff.lastName}`,
        username: staff.username,
        email: staff.email
      }
    })

    if (authError)
      console.log(authError);

    const { data, error } = await supabase
      .from("staff")
      .insert({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        username: staff.username,
        password: staff.password,
        userId: authData.user?.id,
        status: staff.status,
        image: staff.image,
        weeklyHours: staff.weeklyHours,
      })
      .select("id");

    if (error) {
      toast({
        title: "error",
        description: "Error adding staff member",
      });
      setIsSubmitting(false);
    } else {
      const staffId = data[0].id;

      const toAddServices = staff.services.map(service => ({staff_id: staffId, service_id: service.service.id}));
      await supabase.from("staff_services").insert(toAddServices);

      const { error: storageError } = await supabase.storage
        .from("staff")
        .upload(staff.image, staffImage as File,  {
          cacheControl: '3600',
          upsert: true
        });
      
      if (storageError)
        console.log(storageError);

      router.push("/admin/staff");

      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/staff">
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            </Link>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              Add New Staff Member
            </h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Details</CardTitle>
                    <CardDescription>
                      Enter the new staff member&apos;s personal information
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
                      Set the staff member&apos;s weekly working hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                                        onClick={() =>
                                          removeTimeSlot(day, index)
                                        }
                                      >
                                        <X className="h-4 w-4" />
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
                            src={staffImageName}
                            width={300}
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
                            required
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
                            checked={staff.services.some(
                              (s) => s.service.name === service.name
                            )}
                            onCheckedChange={() => handleServiceChange(service)}
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
                Add Staff
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
