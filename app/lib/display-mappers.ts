import type { Severity, NewsCategory, Language, TranslatedText } from "./types";

export type DisplaySeverity = "critical" | "warning" | "info";

export function mapSeverity(severity: Severity): DisplaySeverity {
  switch (severity) {
    case "critical":
      return "critical";
    case "high":
      return "warning";
    case "medium":
    case "low":
      return "info";
  }
}

const CATEGORY_LABELS_KO: Record<NewsCategory, string> = {
  diplomacy: "외교",
  military: "군사/안보",
  economy: "경제/무역",
  human_rights: "인권",
  environment: "환경",
  tech: "기술",
};

const CATEGORY_LABELS_EN: Record<NewsCategory, string> = {
  diplomacy: "Diplomacy",
  military: "Military",
  economy: "Economy",
  human_rights: "Human Rights",
  environment: "Environment",
  tech: "Tech",
};

const CATEGORY_LABELS_JA: Record<NewsCategory, string> = {
  diplomacy: "外交",
  military: "軍事/安保",
  economy: "経済/貿易",
  human_rights: "人権",
  environment: "環境",
  tech: "技術",
};

const CATEGORY_LABELS: Record<Language, Record<NewsCategory, string>> = {
  ko: CATEGORY_LABELS_KO,
  en: CATEGORY_LABELS_EN,
  ja: CATEGORY_LABELS_JA,
};

export function getCategoryLabel(category: NewsCategory, lang: Language = "ko"): string {
  return CATEGORY_LABELS[lang][category] ?? category;
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function getTranslatedText(text: TranslatedText | null, lang: Language): string {
  if (!text) return "";
  return text[lang] || text.en || text.ko || "";
}

export const SEVERITY_STYLES = {
  critical: { color: "var(--accent-red)", bg: "var(--accent-red-dim)", bar: "var(--accent-red)" },
  warning: { color: "var(--accent-amber)", bg: "var(--accent-amber-dim)", bar: "var(--accent-amber)" },
  info: { color: "var(--accent-blue)", bg: "var(--accent-blue-dim)", bar: "var(--accent-blue)" },
} as const;

export const SEVERITY_LABELS: Record<DisplaySeverity, string> = {
  critical: "CRITICAL",
  warning: "WARNING",
  info: "INFO",
};
