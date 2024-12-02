"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  CloudUpload,
  Loader2,
  Clock,
  Eye,
  EyeOff,
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
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ServiceType, StaffType } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";

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
  },
};

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export default function MyAccount() {
  const { t } = useLocale();
  const [staff, setStaff] = useState<StaffType>(staffData);
  const [services, setServices] = useState<{ id: number; name: string }[]>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from("staff")
      .update({
        password: staff.password,
      })
      .eq("id", staff.id);

    if (error) {
      toast({
        title: "Error",
        description: "Error updating password",
      });
      setIsSubmitting(false);
      return;
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(
      staff.userId,
      {
        password: staff.password,
      }
    );

    if (authError) {
      console.error(authError);
    }

    router.push("/staff");

    toast({
      title: "Success",
      description: "Password updated successfully",
    });

    setIsSubmitting(false);
  };

  useEffect(() => {
    fetchServices();
    fetchStaff();
  }, []);

  const fetchServices = async () => {
    await supabase
      .from("services")
      .select("*")
      .then(({ data, error }) => {
        if (error) {
          console.log("error", error);
        } else {
          setServices(data);
        }
      });
  };

  const fetchStaff = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await supabase
      .from("staff")
      .select("*, services:staff_services(service:service_id(id, name))")
      .eq("id", session?.user.user_metadata.staffId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
        } else {
          setStaff(data);
          setSelectedServices(
            data?.services.map((s: ServiceType) => s.service.id)
          );
        }
      });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{t("navigation.myAccount")}</h1>
        </div>
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
                      View the staff member&apos;s personal information
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
                            className="w-full text-muted-foreground"
                            value={staff.firstName}
                            readOnly
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            type="text"
                            className="w-full text-muted-foreground"
                            value={staff.lastName}
                            readOnly
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          className="w-full text-muted-foreground"
                          value={staff.email}
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          className="w-full text-muted-foreground"
                          value={staff.username}
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="w-full pr-10"
                            value={staff.password}
                            onChange={(e) =>
                              setStaff({ ...staff, password: e.target.value })
                            }
                            minLength={6}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={togglePasswordVisibility}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Hours</CardTitle>
                    <CardDescription>
                      View the staff member&apos;s weekly working hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Day</TableHead>
                            <TableHead>Hours</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {daysOfWeek.map((day) => (
                            <TableRow key={day}>
                              <TableCell className="font-medium">
                                {day}
                              </TableCell>
                              <TableCell>
                                {staff.weeklyHours[day].length === 0 ? (
                                  <span className="text-muted-foreground">
                                    Unavailable
                                  </span>
                                ) : (
                                  <div className="flex flex-col space-y-2">
                                    {staff.weeklyHours[day].map(
                                      (slot, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center space-x-2"
                                        >
                                          <Input
                                            type="time"
                                            value={slot.start}
                                            className="w-24"
                                            readOnly
                                          />
                                          <span>-</span>
                                          <Input
                                            type="time"
                                            value={slot.end}
                                            className="w-24"
                                            readOnly
                                          />
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
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
                            <Button
                              variant="outline"
                              className="w-full justify-start mb-2"
                            >
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
                                <div
                                  key={index}
                                  className="flex items-center space-x-2"
                                >
                                  <Input
                                    type="time"
                                    value={slot.start}
                                    className="w-24"
                                    readOnly
                                  />
                                  <span>-</span>
                                  <Input
                                    type="time"
                                    value={slot.end}
                                    className="w-24"
                                    readOnly
                                  />
                                </div>
                              ))}
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
                    <Select value={staff.status ? "true" : "false"} disabled>
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
                      View the profile image for the staff member
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
                            src={`https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staff.image}`}
                            width={300}
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-muted">
                            <CloudUpload className="h-28 w-28 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Services</CardTitle>
                    <CardDescription>
                      View the services this staff member can provide
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
                            disabled
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
