"use client"

import Image from "next/image"
import { Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { StaffWithServices } from "@/lib/database.types"

interface StaffSelectorProps {
  staffMembers: StaffWithServices[]
  selectedStaff: string | null
  setSelectedStaff: (value: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export function StaffSelector({
  staffMembers,
  selectedStaff,
  setSelectedStaff,
  t
}: StaffSelectorProps) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{t("admin-reservation.selectStaff")}</h3>
      <Select
        value={selectedStaff || ""}
        onValueChange={setSelectedStaff}
      >
        <SelectTrigger className="w-full md:w-[300px]">
          <SelectValue placeholder={t("admin-reservation.selectStaff")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="py-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <span className="text-base font-medium">{t("admin-reservation.allStaff")}</span>
            </div>
          </SelectItem>
          
          {/* Active Staff */}
          {staffMembers
            .filter(staff => staff.status)
            .map((staff) => (
              <SelectItem key={staff.id} value={staff.id.toString()} className="py-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 relative overflow-hidden rounded-md flex-shrink-0">
                    <Image
                      src={staff.image ? `https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staff.image}` : "https://www.gravatar.com/avatar/000?d=mp&f=y"}
                      alt={`${staff.firstName} ${staff.lastName}`}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.src = "https://www.gravatar.com/avatar/000?d=mp&f=y";
                      }}
                    />
                  </div>
                  <span className="text-base font-medium">
                    {staff.firstName} {staff.lastName}
                  </span>
                </div>
              </SelectItem>
            ))}

          {/* Separator for Inactive Staff */}
          {staffMembers.some(staff => !staff.status) && (
            <SelectSeparator className="my-2" />
          )}

          {/* Inactive Staff */}
          {staffMembers
            .filter(staff => !staff.status)
            .map((staff) => (
              <SelectItem key={staff.id} value={staff.id.toString()} className="py-2">
                <div className="flex items-center gap-3 opacity-50">
                  <div className="h-10 w-10 relative overflow-hidden rounded-md flex-shrink-0 grayscale">
                    <Image
                      src={staff.image ? `https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${staff.image}` : "https://www.gravatar.com/avatar/000?d=mp&f=y"}
                      alt={`${staff.firstName} ${staff.lastName}`}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.src = "https://www.gravatar.com/avatar/000?d=mp&f=y";
                      }}
                    />
                  </div>
                  <span className="text-base font-medium line-through">
                    {staff.firstName} {staff.lastName}
                  </span>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
} 