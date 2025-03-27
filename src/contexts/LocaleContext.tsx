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

type LocaleKey = "de" | "en";

// Define a more flexible type for the services object
type LocaleStructure = {
  [key: string]: string | LocaleStructure;
};

interface LocaleContextType {
  currentLocale: LocaleKey;
  availableLocales: LocaleKey[];
  changeLocale: (locale: LocaleKey) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const locales: Record<LocaleKey, LocaleStructure> = {
  de: deLocale,
  en: enLocale,
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
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
    (key: string, params?: Record<string, string>): string => {
      const keys = key.split(".");
      let current: unknown = locales[currentLocale];

      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = (current as Record<string, unknown>)[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }

      if (typeof current !== "string") {
        console.warn(`Translation value is not a string: ${key}`);
        return key;
      }

      if (params) {
        return Object.entries(params).reduce(
          (acc, [key, value]) => acc.replace(`{${key}}`, value),
          current
        );
      }

      return current;
    },
    [currentLocale]
  );

  const value: LocaleContextType = {
    currentLocale,
    availableLocales,
    changeLocale,
    t,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  
  return context;
}

