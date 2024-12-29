"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { useLocale } from "@/contexts/LocaleContext";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { useBranch } from "@/contexts/BranchContext";
import { useState } from "react";
import { Branch } from "@/lib/database.types";

interface BranchToggleProps {
  className?: string;
}

export default function BranchToggle({ className }: BranchToggleProps) {
  const { t } = useLocale();
  const router = useRouter();
  const { branches, selectedBranchId, isLoading, updateSelectedBranch } = useBranch();
  const [open, setOpen] = useState(false);

  const handleValueChange = async (value: string) => {
    if (value === "manage") {
      setOpen(false);
      router.push("/admin/branches");
      return;
    }

    await updateSelectedBranch(parseInt(value));
  };

  const selectedBranchName = branches.find(
    (b: Branch) => b.id === selectedBranchId
  )?.name || t("common.selectBranch");

  return (
    <Select 
      value={selectedBranchId.toString()} 
      onValueChange={handleValueChange}
      disabled={isLoading}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className={className ?? "w-[140px]"} >
        <SelectValue placeholder={selectedBranchName}>
          {selectedBranchName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch: Branch) => (
          <SelectItem key={branch.id} value={branch.id.toString()}>
            {branch.name}
          </SelectItem>
        ))}
        <SelectSeparator className="my-1" />
        <div
          className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          onClick={() => {
            setOpen(false);
            router.push("/admin/branches");
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          {t("branches.manage")}
        </div>
      </SelectContent>
    </Select>
  );
} 