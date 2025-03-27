import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { StaffWithServices } from "@/lib/types";

interface StaffMemberProps {
  staff: StaffWithServices;
  onDelete: (id: number) => void;
  t: (key: string) => string;
  view: "table" | "card";
}

export function StaffMember({ staff, onDelete, t, view }: StaffMemberProps) {
  const renderImage = (size: number) =>
    staff.image ? (
      <Image
        src={`https://rlffvcspggzfedokaqsr.supabase.co/storage/v1/object/public/staff/${staff.image}`}
        alt={`${staff.firstName} ${staff.lastName}`}
        width={size}
        height={size}
        className="rounded-md aspect-square object-cover"
        unoptimized
      />
    ) : (
      <div
        className={`h-${size / 4} w-${
          size / 4
        } rounded-md aspect-square bg-muted`}
      />
    );

  const renderServices = () => {
    if (staff.services.length === 0) {
      return <span className="text-sm text-muted-foreground">-</span>;
    }

    return (
      <HoverCard>
        <HoverCardTrigger>
          <div className="inline-block">
            <Badge variant="outline" className="cursor-pointer">
              {staff.services.length} {t("admin-staff.services")}
            </Badge>
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start" className="w-auto max-w-[300px] p-0">
          <Card className="border-0 shadow-none">
            <div className="p-2 border-b">
              <h4 className="font-medium text-sm">{t("admin-staff.services")}</h4>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              <div className="p-2">
                <div className="flex flex-wrap gap-1.5">
                  {staff.services.map((service) => (
                    <Badge
                      key={service.service.id}
                      variant="outline"
                      className="whitespace-normal break-words text-xs"
                    >
                      {service.service.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const renderActions = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t("admin-staff.actions")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("admin-staff.actions")}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/admin/staff/edit/${staff.id}`}>
            {t("admin-staff.edit")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(staff.id)}>
          {t("admin-staff.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (view === "card") {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">{renderImage(48)}</div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium truncate">
                {staff.firstName} {staff.lastName}
              </div>
              <div className="flex-shrink-0">{renderActions()}</div>
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {staff.email}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={staff.status ? "default" : "destructive"}
                className={
                  staff.status
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-red-500"
                }
              >
                {staff.status
                  ? t("admin-staff.active")
                  : t("admin-staff.passive")}
              </Badge>
              {renderServices()}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <TableRow>
      <TableCell className="w-[50px] pl-4">{renderImage(64)}</TableCell>
      <TableCell>
        <div className="flex flex-col min-w-0">
          <div className="font-medium truncate">
            {staff.firstName} {staff.lastName}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {staff.email}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={staff.status ? "default" : "destructive"}
          className={
            staff.status
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-red-500"
          }
        >
          {staff.status ? t("admin-staff.active") : t("admin-staff.passive")}
        </Badge>{" "}
      </TableCell>
      <TableCell>{renderServices()}</TableCell>
      <TableCell className="text-right w-[50px] pr-4">
        {renderActions()}
      </TableCell>
    </TableRow>
  );
}
