"use client";
import { useCallback } from "react";
import { useLanguage } from "../lib/language-context";
import { t } from "../i18n";

export function useT() {
  const { lang } = useLanguage();
  return useCallback((key: string) => t(lang, key), [lang]);
}
