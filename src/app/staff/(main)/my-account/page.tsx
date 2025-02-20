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
import { StaffWithServices, TimeSlot, WeeklyHours } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LANGUAGES } from "@/lib/constants";

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const

const staffData: StaffWithServices = {
  id: 0,
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
  userId: "",
  branchId: 0,
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
  created_at: "",
  updated_at: null,
  languages: []
};

export default function MyAccount() {
  const { t } = useLocale();
  const [staff, setStaff] = useState<StaffWithServices>(staffData);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");

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
        password: password,
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
        password: password,
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

  const fetchStaff = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        });
        return;
      }

      const { data: staffData, error } = await supabase
        .from("staff")
        .select(`
          *,
          services:staff_services (
            service:services (
              id,
              name
            )
          )
        `)
        .eq("userId", user.id)
        .single();

      if (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Error fetching staff data",
          variant: "destructive",
        });
        return;
      }

      if (staffData) {
        const formattedStaff = {
          ...staffData,
          services: staffData.services?.map((s: { service: { id: number; name: string } }) => ({
            service: {
              id: s.service.id,
              name: s.service.name
            }
          })) || [],
          weeklyHours: staffData.weeklyHours || {
            SUN: [],
            MON: [],
            TUE: [],
            WED: [],
            THU: [],
            FRI: [],
            SAT: [],
          },
          languages: staffData.languages || []
        };
        
        setStaff(formattedStaff);
        setPassword(formattedStaff.password || "");
      }
    } catch (error) {
      console.error("Error in fetchStaff:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);



  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
            <Link href="/staff">
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">{t("common.back")}</span>
              </Button>
            </Link>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              {t("staff-my-account.myAccount")}
            </h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("staff-my-account.staffDetails")}</CardTitle>
                    <CardDescription>
                      {t("staff-my-account.viewStaffPersonalInformation")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="firstName">{t("staff-my-account.firstName")}</Label>
                          <Input
                            id="firstName"
                            type="text"
                            className="w-full"
                            value={staff.firstName || ""}
                            readOnly
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">{t("staff-my-account.lastName")}</Label>
                          <Input
                            id="lastName"
                            type="text"
                            className="w-full"
                            value={staff.lastName || ""}
                            readOnly
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">{t("staff-my-account.email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          className="w-full"
                          value={staff.email || ""}
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">{t("staff-my-account.username")}</Label>
                        <Input
                          id="username"
                          type="text"
                          className="w-full"
                          value={staff.username || ""}
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">{t("staff-my-account.password")}</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pr-10"
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("staff-my-account.weeklyHours")}</CardTitle>
                    <CardDescription>
                      {t("staff-my-account.weeklyHoursDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">{t("staff-my-account.day")}</TableHead>
                            <TableHead>{t("staff-my-account.hours")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {daysOfWeek.map((day) => (
                            <TableRow key={day}>
                              <TableCell className="font-medium">{day}</TableCell>
                              <TableCell>
                                {staff.weeklyHours[day as keyof WeeklyHours].length === 0 ? (
                                  <span className="text-muted-foreground">
                                    {t("staff-my-account.notAvailable")}
                                  </span>
                                ) : (
                                  <div className="flex flex-col space-y-2">
                                    {staff.weeklyHours[day as keyof WeeklyHours].map((slot: TimeSlot, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-2"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                          <span>
                                            {slot.start} - {slot.end}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
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
                              className="mb-2 flex w-full justify-between"
                            >
                              {day}
                              <span className="ml-auto">
                                {staff.weeklyHours[day as keyof WeeklyHours].length === 0
                                  ? t("staff-my-account.notAvailable")
                                  : `${staff.weeklyHours[day as keyof WeeklyHours].length} slot(s)`}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              {staff.weeklyHours[day as keyof WeeklyHours].map((slot: TimeSlot, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {slot.start} - {slot.end}
                                    </span>
                                  </div>
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
                    <CardTitle>{t("staff-my-account.staffStatus")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={staff.status ? "true" : "false"} disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">{t("staff-my-account.active")}</SelectItem>
                        <SelectItem value="false">{t("staff-my-account.passive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("admin-staff.languages")}</CardTitle>
                    <CardDescription>
                      {t("admin-staff.languagesDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(staff.languages || []).map((langId) => (
                        <Badge
                          key={langId}
                          variant={(staff.languages || []).includes(langId) ? "default" : "outline"}
                          className="cursor-pointer hover:opacity-80"
                        >
                          {LANGUAGES.find(l => l.id === langId)?.name}
                        </Badge>
                      ))}
                      {(staff.languages || []).length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          {t("admin-staff.noLanguagesSpecified")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>{t("staff-my-account.staffImage")}</CardTitle>
                    <CardDescription>
                      {t("staff-my-account.uploadImageDescription")}
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
                    <CardTitle>{t("staff-my-account.staffServices")}</CardTitle>
                    <CardDescription>
                      {t("staff-my-account.viewStaffServices")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {staff.services?.map((service) => (
                        <div
                          key={service.service.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={service.service.id.toString()}
                            checked={true}
                            disabled
                          />
                          <label
                            htmlFor={service.service.id.toString()}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {service.service.name}
                          </label>
                        </div>
                      ))}
                      {staff.services?.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          {t("staff-my-account.noServicesAssigned")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-3 flex justify-end gap-4">
                <Button type="button" variant="outline">
                  {t("staff-my-account.cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("staff-my-account.updatePassword")}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
