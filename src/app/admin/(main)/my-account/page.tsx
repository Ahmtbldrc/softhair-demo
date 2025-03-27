"use client";

import { useEffect, useState } from 'react'
import Image from "next/image"
import { ChevronLeft, Upload, Plus, X, CloudUpload, Loader2, Clock, Eye, EyeOff, ChevronRight, Search } from "lucide-react"
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
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ServiceType, StaffType, TimeSlot, WeeklyHours } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import { useBranch } from '@/contexts/BranchContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getActiveServices } from "@/lib/services/service.service";
import { LANGUAGES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

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
  languages: []
}

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const

export default function MyAccount() {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();
  const [staff, setStaff] = useState<StaffType>(staffData);
  const [staffImageName, setStaffImageName] = useState<string>("");
  const [staffImage, setStaffImage] = useState<File | null>(null);
  const [services, setServices] = useState<{ id: number; name: string; status: boolean }[]>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [oldPassword, setOldPassword] = useState<string>("");

  const router = useRouter();

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [originalStaff, setOriginalStaff] = useState<StaffType>(staffData);
  const [showPassword, setShowPassword] = useState(false);
  const [lastEmailUpdate, setLastEmailUpdate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredServices, setFilteredServices] = useState<{ id: number; name: string; status: boolean }[]>([]);

  const handleServiceChange = (serviceId: number) => {
    setSelectedServices(prevSelectedServices =>
      prevSelectedServices.includes(serviceId)
        ? prevSelectedServices.filter(id => id !== serviceId)
        : [...prevSelectedServices, serviceId]
    );
  };

  const handleWeeklyHoursChange = (day: keyof WeeklyHours, index: number, field: keyof TimeSlot, value: string) => {
    setStaff((prev: StaffType) => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: prev.weeklyHours[day].map((slot: TimeSlot, i: number) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }

  const addTimeSlot = (day: keyof WeeklyHours) => {
    setStaff((prev: StaffType) => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: [...prev.weeklyHours[day], { start: "09:00", end: "17:00" }]
      }
    }))
  }

  const removeTimeSlot = (day: keyof WeeklyHours, index: number) => {
    setStaff((prev: StaffType) => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: prev.weeklyHours[day].filter((_: TimeSlot, i: number) => i !== index)
      }
    }))
  }

  const handleUploadStaffImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);

      setStaffImageName(objectUrl);
      setStaffImage(file);

      const fileExtension = e.target.files[0]?.name.split(".").pop();
      const fileName = `${staff.firstName.toLowerCase()}-${staff.lastName.toLowerCase()}.${fileExtension}`;

      staff.image = fileName;
      setStaff(staff);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates: { 
        data: { 
          fullName: string; 
          username: string; 
          email: string; 
        };
        password?: string;
      } = {
        data: {
          fullName: `${staff.firstName} ${staff.lastName}`,
          username: staff.username,
          email: staff.email
        }
      };

      // Sadece şifre değişmişse şifre güncellemesi yap
      if (staff) {
        if (staff.password.length < 6) {
          toast({
            title: "Error",
            description: "Password must be at least 6 characters",
            variant: "destructive"
          });
          return;
        }
      }

      if (staff.password !== oldPassword) {
        updates.password = staff.password;
      }

      // Diğer kullanıcı verilerini güncelle
      const { error: updateError } = await supabase.auth.updateUser(updates);

      if (updateError) {
        throw updateError;
      }

      if (user?.email !== staff.email) {
        if (lastEmailUpdate && Date.now() - lastEmailUpdate.getTime() < 60000) {
          toast({
            title: "Error",
            description: "Please wait 1 minute before updating username again",
            variant: "destructive"
          });
          return;
        }

        const { error: emailError } = await supabase.auth.updateUser({
          email: `${staff.username}@softsidedigital.com`
        });

        if (emailError) {
          toast({
            title: "Error",
            description: "Failed to update email",
            variant: "destructive"
          });
          return;
        }

        setLastEmailUpdate(new Date());
      }

      if (currentUsername !== staff.username) {
        const { data: existUser } = await supabase
          .from("staff")
          .select("*")
          .eq("username", staff.username)
          .neq("id", staff.id);

        if (existUser?.length) {
          toast({
            title: "Error!",
            description: `Username already exists (${staff.username})`,
          });
          setIsSubmitting(false);
          return;
        }
      }
    
      const { error: staffError } = await supabase
        .from("staff")
        .update({
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          username: staff.username,
          password: staff.password !== "********" ? staff.password : undefined,
          status: staff.status,
          image: staff.image,
          weeklyHours: staff.weeklyHours,
          languages: staff.languages,
        })
        .eq("id", staff.id);
    
      if (staffError) {
        toast({
          title: "Error",
          description: "Error updating staff profile",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { data: existingItems } = await supabase
        .from("staff_services")
        .select("service_id")
        .eq("staff_id", staff.id);
    
      const existingIds = existingItems?.map((item) => item.service_id);
      const toAdd = selectedServices.filter((id) => !existingIds?.includes(id));
      const toDelete = existingIds!.filter((id) => !selectedServices.includes(id));
    
      if (toAdd.length > 0) {
        await supabase
          .from("staff_services")
          .insert(toAdd.map((service_id) => ({ staff_id: staff.id, service_id })));
      }
    
      if (toDelete.length > 0) {
        await supabase
          .from("staff_services")
          .delete()
          .in("service_id", toDelete)
          .eq("staff_id", staff.id);
      }
    
      if (staffImage) {
        await supabase.storage
          .from("staff")
          .upload(staff.image, staffImage, {
            cacheControl: '3600',
            upsert: true
          });
      }
    
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
    finally {
      setIsSubmitting(false);
    }

  };

  useEffect(() => {
    const getCurrentUserAndStaff = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        router.push('/auth/login');
        return;
      }

      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*, services:staff_services(service:service_id(id, name))")
        .eq("userId", user.id)
        .single();

      if (staffError || !staffData) {
        toast({
          title: "Error",
          description: "Could not fetch staff profile",
          variant: "destructive",
        });
        return;
      }

      setStaff(staffData);
      setOriginalStaff(staffData);
      setCurrentUsername(staffData?.username);
      setSelectedServices(staffData?.services.map((s: ServiceType) => s.service.id));
      setOldPassword(staffData?.password);
    };


    getActiveServices(selectedBranchId)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching services:", error);
        } else {
          setServices(data?.map((service) => ({
            id: service.id,
            name: service.name ?? "",
            status: service.status ?? true
          })) ?? []);
        }
      });

    getCurrentUserAndStaff();
  }, [router, selectedBranchId]);

  useEffect(() => {
    if (services) {
      const filtered = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [services, searchQuery]);

  const handleDiscard = () => {
    setShowDiscardDialog(true);
  };

  const handleConfirmDiscard = () => {
    setStaff(originalStaff);
    setStaffImageName("");
    setStaffImage(null);
    setSelectedServices(originalStaff?.services.map((s: ServiceType) => s.service.id) || []);
    setShowDiscardDialog(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">{t("staff-my-account.back")}</span>
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
                    <CardTitle>{t("staff-my-account.staffDetails")}</CardTitle>
                    <CardDescription>
                      {t("staff-my-account.enterStaffPersonalInformation")}
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
                            value={staff.firstName}
                            onChange={(e) =>
                              setStaff({ ...staff, firstName: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">{t("staff-my-account.lastName")}</Label>
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
                        <Label htmlFor="email">{t("staff-my-account.email")}</Label>
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
                        <Label htmlFor="username">{t("staff-my-account.username")}</Label>
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
                        <Label htmlFor="password">{t("staff-my-account.password")}</Label>
                        <div className="relative flex items-center">
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
                            size="sm"
                            className="absolute right-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            )}
                            <span className="sr-only">
                              {showPassword ? t("staff-my-account.hidePassword") : t("staff-my-account.showPassword")}
                            </span>
                          </Button>
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
                            <TableHead className="text-right">{t("staff-my-account.actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {daysOfWeek.map((day) => (
                            <TableRow key={day}>
                              <TableCell className="font-medium">{day}</TableCell>
                              <TableCell>
                                {staff.weeklyHours[day].length === 0 ? (
                                  <span className="text-muted-foreground">
                                    {t("staff-my-account.unavailable")}
                                  </span>
                                ) : (
                                  <div className="flex flex-col space-y-2">
                                    {staff.weeklyHours[day].map((slot: TimeSlot, index: number) => (
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
                                            removeTimeSlot(day, 
                                            index)
                                          }
                                        >
                                          <X className="h-4 w-4" />
                                          <span className="sr-only">{t("staff-my-account.removeTimeSlot")}</span>
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
                                  {t("staff-my-account.add")}
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
                                  ? t("staff-my-account.unavailable")
                                  : `${staff.weeklyHours[day].length} ${t("admin-staff.slots")}`}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              {staff.weeklyHours[day].map((slot: TimeSlot, index: number) => (
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
                                    <span className="sr-only">{t("staff-my-account.removeTimeSlot")}</span>
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
                                {t("staff-my-account.addTimeSlot")}
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
                    <CardTitle>{t("staff-my-account.staffStatus")}</CardTitle>
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
                        <SelectItem value="true">{t("staff-my-account.active")}</SelectItem>
                        <SelectItem value="false">{t("staff-my-account.passive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("staff-my-account.languages")}</CardTitle>
                    <CardDescription>
                      {t("staff-my-account.languagesDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
                      {LANGUAGES.map((language) => (
                        <Badge
                          key={language.id}
                          variant={(staff.languages || []).includes(language.id) ? "default" : "outline"}
                          className="cursor-pointer hover:opacity-80 text-sm md:text-base py-1.5 px-3"
                          onClick={() => {
                            const currentLanguages = staff.languages || [];
                            const updatedLanguages = currentLanguages.includes(language.id)
                              ? currentLanguages.filter(id => id !== language.id)
                              : [...currentLanguages, language.id];
                            setStaff(prev => ({
                              ...prev,
                              languages: updatedLanguages
                            }));
                          }}
                        >
                          {language.name}
                          {(staff.languages || []).includes(language.id) && (
                            <X className="ml-1.5 h-3 w-3" />
                          )}
                        </Badge>
                      ))}
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
                            src={ staffImageName.length === 0 
                              ? `https://rlffvcspggzfedokaqsr.supabase.co/storage/v1/object/public/staff/${staff.image}` 
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
                            <span>{t("staff-my-account.uploadImage")}</span>
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
                    <CardTitle>{t("staff-my-account.staffServices")}</CardTitle>
                    <CardDescription>
                      {t("staff-my-account.staffServicesDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <div className="flex items-center gap-2">
                            <span>{t("staff-my-account.selectServices")}</span>
                            {selectedServices.length > 0 && (
                              <Badge variant="secondary">
                                {selectedServices.length} {t("staff-my-account.selected")}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{t("staff-my-account.selectServices")}</DialogTitle>
                          <DialogDescription>
                            {t("staff-my-account.selectServicesDescription")}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={t("staff-my-account.searchServices")}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                          <div className="max-h-[400px] overflow-y-auto">
                            <div className="grid gap-2">
                              {filteredServices.map((service) => (
                                <div
                                  key={service.id}
                                  className={cn(
                                    "flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer",
                                    selectedServices.includes(service.id) && "bg-primary/10"
                                  )}
                                  onClick={() => handleServiceChange(service.id)}
                                >
                                  <Checkbox
                                    id={service.id.toString()}
                                    checked={selectedServices.includes(service.id)}
                                    onCheckedChange={() => handleServiceChange(service.id)}
                                    className="pointer-events-none"
                                  />
                                  <label
                                    htmlFor={service.id.toString()}
                                    className="text-sm font-medium leading-none cursor-pointer flex-1"
                                  >
                                    {service.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">
                                {t("common.cancel")}
                              </Button>
                            </DialogClose>
                            <Button>
                              {t("common.confirm")}
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={handleDiscard}>
                {t("staff-my-account.discard")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("staff-my-account.saveChanges")}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("staff-my-account.discardConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("staff-my-account.discardConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("staff-my-account.cancelDiscard")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              {t("staff-my-account.confirmDiscard")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}