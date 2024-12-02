"use client";

import { useLocale } from "@/contexts/LocaleContext";

export default function Footer() {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background py-3">
      <div className="container flex justify-center items-center">
        <p className="text-sm text-center">
          © {currentYear}{" "}
          <a
            href="https://softsidedigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-gray-500 via-white to-gray-500 bg-clip-text text-transparent"
          >
            {t("common.company")}
          </a>
          . {t("common.allRightsReserved")}
        </p>
      </div>
    </footer>
  );
}
