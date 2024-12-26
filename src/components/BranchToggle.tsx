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

export default function BranchToggle() {
  const { t } = useLocale();
  const router = useRouter();

  const handleValueChange = (value: string) => {
    if (value === "manage") {
      router.push("/admin/branches");
      return;
    }
    // Normal branch değişiklik işlemleri
  };

  return (
    <Select defaultValue="main-branch" onValueChange={handleValueChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={t("common.selectBranch")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="main-branch">{t("branches.main")}</SelectItem>
        <SelectItem value="branch-2">{t("branches.second")}</SelectItem>
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