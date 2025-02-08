import { ChevronLeft, Upload, Plus, X, CloudUpload, Loader2, Clock, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useStaffForm } from "@/hooks/use-staff-form"
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
import { LANGUAGES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"


interface StaffFormProps {
  branchId: number
  staffId?: string
  t: (key: string) => string
}

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const

export function StaffForm({ branchId, staffId, t }: StaffFormProps) {
  const {
    staff,
    services,
    staffImageName,
    isSubmitting,
    showDiscardDialog,
    showPassword,
    errors,
    selectedServices,
    handleServiceChange,
    handleWeeklyHoursChange,
    addTimeSlot,
    removeTimeSlot,
    handleUploadStaffImage,
    handleSubmit,
    handleDiscard,
    handleConfirmDiscard,
    setStaff,
    setShowPassword,
    setShowDiscardDialog
  } = useStaffForm({ branchId, staffId, t })

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/staff">
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">{t("common.back")}</span>
              </Button>
            </Link>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              {staffId ? `${staff.firstName} ${staff.lastName}` : t("admin-staff-add.addNewStaffMember")}
            </h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("admin-staff.staffDetails")}</CardTitle>
                    <CardDescription>
                      {t("admin-staff.enterStaffPersonalInformation")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="firstName">{t("admin-staff.firstName")}</Label>
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
                          <Label htmlFor="lastName">{t("admin-staff.lastName")}</Label>
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
                        <Label htmlFor="email">{t("admin-staff.email")} ({t("common.optional")})</Label>
                        <Input
                          id="email"
                          type="email"
                          className="w-full"
                          value={staff.email}
                          onChange={(e) =>
                            setStaff({ ...staff, email: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">{t("admin-staff.username")}</Label>
                        <Input
                          id="username"
                          type="text"
                          className={cn("w-full", errors.some(e => e.field === "username") && "border-red-500")}
                          value={staff.username}
                          onChange={(e) =>
                            setStaff({ ...staff, username: e.target.value })
                          }
                          required
                        />
                        {errors.some(e => e.field === "username") && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.find(e => e.field === "username")?.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="password">{t("admin-staff.password")}</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="w-full pr-10"
                            value={staff.password}
                            onChange={(e) =>
                              setStaff({ ...staff, password: e.target.value })
                            }
                            required={!staffId}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPassword ? t("common.hidePassword") : t("common.showPassword")}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("admin-staff.weeklyHours")}</CardTitle>
                    <CardDescription>
                      {t("admin-staff.weeklyHoursDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">{t("admin-staff.day")}</TableHead>
                            <TableHead>{t("admin-staff.hours")}</TableHead>
                            <TableHead className="text-right">{t("admin-staff.actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {daysOfWeek.map((day) => (
                            <TableRow key={day}>
                              <TableCell className="font-medium">{day}</TableCell>
                              <TableCell>
                                {staff.weeklyHours[day].length === 0 ? (
                                  <span className="text-muted-foreground">
                                    {t("admin-staff.unavailable")}
                                  </span>
                                ) : (
                                  <div className="flex flex-col space-y-2">
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
                                          <span className="sr-only">{t("admin-staff.removeTimeSlot")}</span>
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
                                  size="icon"
                                  onClick={() => addTimeSlot(day)}
                                >
                                  <Plus className="h-4 w-4" />
                                  <span className="sr-only">{t("admin-staff.addTimeSlot")}</span>
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
                                  ? t("admin-staff.unavailable")
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
                                    <span className="sr-only">{t("admin-staff.removeTimeSlot")}</span>
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => addTimeSlot(day)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                {t("admin-staff.addTimeSlot")}
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
                    <CardTitle>{t("admin-staff.staffStatus")}</CardTitle>
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
                        <SelectItem value="true">{t("admin-staff.active")}</SelectItem>
                        <SelectItem value="false">{t("admin-staff.passive")}</SelectItem>
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
                    <CardTitle>{t("admin-staff.staffImage")}</CardTitle>
                    <CardDescription>
                      {t("admin-staff.uploadImageDescription")}
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
                            src={
                              staffImageName.length === 0
                                ? `https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staff.image}`
                                : staffImageName
                            }
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
                            <span>{t("admin-staff.uploadImage")}</span>
                          </div>
                          <Input
                            id="picture"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleUploadStaffImage}
                          />
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("admin-staff.staffServices")}</CardTitle>
                    <CardDescription>
                      {t("admin-staff.staffServicesDescription")}
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
              <div className="lg:col-span-3 flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={handleDiscard}>
                  {t("common.discard")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {staffId ? t("common.save") : t("common.create")}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.areYouSure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.discardChangesWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              {t("common.discard")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 