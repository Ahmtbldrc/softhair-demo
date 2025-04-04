"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h2 className="text-2xl font-bold">{t("customers.error.title")}</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {t("customers.error.description")}
      </p>
      <Button onClick={() => reset()}>{t("customers.error.retry")}</Button>
    </div>
  );
} 