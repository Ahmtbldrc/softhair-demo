"use client";

import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";

export default function Footer() {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background py-3">
      <div className="container flex justify-center items-center">
        <p className="text-sm text-center">
          © {currentYear}{" "}
          <Link
            href="https://softsidedigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="dark:bg-gradient-to-r dark:from-gray-400 dark:via-white dark:to-gray-400 bg-gradient-to-r from-black via-gray-200 to-black animate-gradient bg-[length:200%_100%] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            {t("common.company")}
          </Link>
          . {t("common.allRightsReserved")}
        </p>
      </div>
    </footer>
  );
}
