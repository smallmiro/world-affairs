"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Language } from "./types";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  cycleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LANG_ORDER: Language[] = ["ko", "en", "ja"];
const STORAGE_KEY = "sigint-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("ko");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && LANG_ORDER.includes(stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  };

  const cycleLang = () => {
    const idx = LANG_ORDER.indexOf(lang);
    const next = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    setLang(next);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, cycleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
