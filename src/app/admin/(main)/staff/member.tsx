import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import React from "react";
import ActionToggleMenu from "./action-toggle-menu";
import { StaffType } from "@/lib/types";
import Image from "next/image";
import { useLocale } from "@/contexts/LocaleContext";


type Props = {
  member: StaffType;
  handleDelete: () => Promise<void>;
};

function Member({ member, handleDelete }: Props) {
  const { t } = useLocale();
  return (
    <TableRow key={member.id}>
      <TableCell className="hidden sm:table-cell">
        <Image
          alt={`${member.firstName} ${member.lastName} image`}
          className="aspect-square rounded-md object-cover"
          src={`https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${member.image}`}
          width={64}
          height={64}
          unoptimized
        />
      </TableCell>
      <TableCell className="font-medium">
        {`${member.firstName} ${member.lastName}`}
      </TableCell>
      <TableCell>
        <Badge
          variant={member.status ? "default" : "destructive"}
          className={
            member.status
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-red-500"
          }
        >
          {member.status ? t("admin-staff.active") : t("admin-staff.passive")}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {member.services?.map((service, index) => (
          <Badge key={index} variant="outline" className="mr-1 mb-1">
            {service.service.name}
          </Badge>
        ))}
      </TableCell>
      <TableCell>
        <ActionToggleMenu
          staff={member}
          handleDelete={() => handleDelete()}
        />
      </TableCell>
    </TableRow>
  );
}

export default Member;
