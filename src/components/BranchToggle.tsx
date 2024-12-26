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

export default function BranchToggle() {
  const { t } = useLocale();
  const router = useRouter();
  const { branches, selectedBranchId, isLoading, updateSelectedBranch } = useBranch();

  const selectedBranch = branches.find(b => b.id.toString() === selectedBranchId);

  const handleValueChange = async (value: string) => {
    if (value === "manage") {
      router.push("/admin/branches");
      return;
    }

    await updateSelectedBranch(value);
  };

  return (
    <Select 
      value={selectedBranchId} 
      onValueChange={handleValueChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          {selectedBranch?.name || t("common.selectBranch")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id.toString()}>
            {branch.name}
          </SelectItem>
        ))}
        <SelectSeparator className="my-1" />
        <div
          className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          onClick={() => router.push("/admin/branches")}
        >
          <Settings className="mr-2 h-4 w-4" />
          {t("branches.manage")}
        </div>
      </SelectContent>
    </Select>
  );
} 