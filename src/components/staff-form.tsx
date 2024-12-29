import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useLocale } from "@/contexts/LocaleContext"
import { useStaffForm, StaffFormState } from "@/hooks/use-staff-form"
import { ChangeEvent } from "react"

interface StaffFormProps {
  branchId: number
  staffId?: string
  onFormChange?: () => void
  isSubmitting?: boolean
  setIsSubmitting?: (value: boolean) => void
}

export function StaffForm({ 
  branchId, 
  staffId, 
  onFormChange,
  setIsSubmitting: externalSetIsSubmitting 
}: StaffFormProps) {
  const { t } = useLocale()
  const {
    staff,
    showPassword,
    handleSubmit: internalHandleSubmit,
    setShowPassword,
    handleFormValueChange: internalHandleFormValueChange
  } = useStaffForm({ branchId, staffId, t })

  const setIsSubmitting = externalSetIsSubmitting ?? (() => {})

  const handleFormValueChange = (field: keyof StaffFormState, value: string) => {
    internalHandleFormValueChange(field, value)
    onFormChange?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    setIsSubmitting(true)
    await internalHandleSubmit(e)
  }

  return (
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
                      value={staff.firstName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFormValueChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t("admin-staff.lastName")}</Label>
                    <Input
                      id="lastName"
                      value={staff.lastName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFormValueChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">{t("admin-staff.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={staff.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleFormValueChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">{t("admin-staff.username")}</Label>
                  <Input
                    id="username"
                    value={staff.username}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleFormValueChange("username", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">{t("admin-staff.password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="w-full pr-10"
                      value={staff.password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFormValueChange("password", e.target.value)}
                      minLength={6}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? t("admin-staff.hidePassword") : t("admin-staff.showPassword")}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* ... rest of the form ... */}
        </div>
      </div>
    </form>
  )
} 