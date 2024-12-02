"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LocaleToggle() {
  const { currentLocale, changeLocale, availableLocales } = useLocale();

  return (
    <Select value={currentLocale} onValueChange={changeLocale}>
      <SelectTrigger className="w-[100px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableLocales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {locale === "de" ? "Deutsch" : "English"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
