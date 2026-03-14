import ko from "./ko.json";
import en from "./en.json";
import ja from "./ja.json";
import type { Language } from "../lib/types";

const messages: Record<Language, Record<string, unknown>> = { ko, en, ja };

export function t(lang: Language, key: string): string {
  const parts = key.split(".");
  let current: unknown = messages[lang];
  for (const part of parts) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === "string" ? current : key;
}
