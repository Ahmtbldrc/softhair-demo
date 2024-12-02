"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from "react";
import deLocale from "@/locales/de.json";
import enLocale from "@/locales/en.json";

type LocaleStructure = typeof deLocale;
type LocaleKey = "de" | "en";

interface LocaleContextType {
  currentLocale: LocaleKey;
  availableLocales: LocaleKey[];
  changeLocale: (locale: LocaleKey) => void;
  t: (key: string) => string;
}

const locales: Record<LocaleKey, LocaleStructure> = {
  de: deLocale,
  en: enLocale,
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [currentLocale, setCurrentLocale] = useState<LocaleKey>(() => {
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem("NEXT_LOCALE");
      return (savedLocale as LocaleKey) || "de";
    }
    return "de";
  });

  const availableLocales: LocaleKey[] = ["de", "en"];

  const changeLocale = useCallback((locale: LocaleKey) => {
    if (availableLocales.includes(locale)) {
      localStorage.setItem("NEXT_LOCALE", locale);
      setCurrentLocale(locale);
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      let current: unknown = locales[currentLocale];

      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = (current as Record<string, unknown>)[k];
        } else {
          return key;
        }
      }

      return typeof current === "string" ? current : key;
    },
    [currentLocale]
  );

  return (
    <LocaleContext.Provider
      value={{ currentLocale, availableLocales, changeLocale, t }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
