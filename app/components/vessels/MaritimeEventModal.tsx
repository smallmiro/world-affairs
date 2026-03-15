"use client";

import { useEffect } from "react";
import type { GeoEvent } from "../../../src/domain/geopolitics/entities";
import type { Language } from "../../lib/types";
import { getTranslatedText, formatTime, mapSeverity, SEVERITY_STYLES, SEVERITY_LABELS } from "../../lib/display-mappers";
import { useT } from "../../hooks/use-t";

interface MaritimeEventModalProps {
  event: GeoEvent;
  lang: Language;
  onClose: () => void;
}

const REGION_LABELS: Record<string, Record<string, string>> = {
  "middle-east": { ko: "중동", en: "Middle East", ja: "中東" },
  "east-asia": { ko: "동아시아", en: "East Asia", ja: "東アジア" },
  europe: { ko: "유럽", en: "Europe", ja: "ヨーロッパ" },
  "south-asia": { ko: "남아시아", en: "South Asia", ja: "南アジア" },
  "north-america": { ko: "북미", en: "North America", ja: "北米" },
  africa: { ko: "아프리카", en: "Africa", ja: "アフリカ" },
};

const EVENT_TYPE_LABELS: Record<string, Record<string, string>> = {
  conflict: { ko: "분쟁", en: "Conflict", ja: "紛争" },
  protest: { ko: "시위", en: "Protest", ja: "抗議" },
  sanctions: { ko: "제재", en: "Sanctions", ja: "制裁" },
  military_exercise: { ko: "군사훈련", en: "Military Exercise", ja: "軍事演習" },
  trade_dispute: { ko: "무역분쟁", en: "Trade Dispute", ja: "貿易紛争" },
  humanitarian_crisis: { ko: "인도위기", en: "Humanitarian Crisis", ja: "人道危機" },
  diplomacy: { ko: "외교", en: "Diplomacy", ja: "外交" },
  other: { ko: "기타", en: "Other", ja: "その他" },
};

export default function MaritimeEventModal({ event, lang, onClose }: MaritimeEventModalProps) {
  const t = useT();
  const displaySeverity = mapSeverity(event.severity);
  const s = SEVERITY_STYLES[displaySeverity];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const eventTypeLabel = EVENT_TYPE_LABELS[event.eventType]?.[lang] ?? event.eventType;
  const countryCodes = event.countries ?? [];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto border rounded-2xl"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)", animation: "fade-in-up 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-3 border-b rounded-t-2xl" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[0.8rem] font-bold tracking-[1px] px-2 py-0.5 rounded-lg" style={{ color: s.color, background: s.bg }}>
              {SEVERITY_LABELS[displaySeverity]}
            </span>
            <span className="font-mono text-[0.8rem] px-2 py-0.5 border rounded-lg" style={{ color: "var(--accent-cyan)", borderColor: "var(--border)" }}>
              {eventTypeLabel}
            </span>
          </div>
          <button onClick={onClose} className="w-11 h-11 grid place-items-center cursor-pointer text-[1.2rem]" style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>

        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: s.bar }} />

        {/* Content */}
        <div className="px-5 py-4 pl-6">
          {/* Title */}
          <h3 className="text-[1.1rem] font-semibold leading-[1.4] mb-3" style={{ color: "var(--text-primary)" }}>
            {getTranslatedText(event.title, lang)}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="font-mono text-[0.85rem]" style={{ color: "var(--text-muted)" }}>
              {formatTime(event.eventDate)}
            </span>
            <span className="font-mono text-[0.85rem]" style={{ color: "var(--accent-cyan)" }}>
              {event.source}
            </span>
            {countryCodes.length > 0 && (
              <span className="font-mono text-[0.85rem]" style={{ color: "var(--text-muted)" }}>
                {countryCodes.join(", ")}
              </span>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-4">
              <div className="font-mono text-[0.8rem] tracking-[1px] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                {t("maritime.description")}
              </div>
              <div className="text-[0.95rem] leading-[1.6] p-3 rounded-xl" style={{ color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>
                {getTranslatedText(event.description, lang)}
              </div>
            </div>
          )}

          {/* Location */}
          {event.lat && event.lon && (
            <div className="mb-4">
              <div className="font-mono text-[0.8rem] tracking-[1px] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                {t("maritime.location")}
              </div>
              <div className="font-mono text-[0.9rem]" style={{ color: "var(--text-secondary)" }}>
                {event.lat.toFixed(2)}°N, {event.lon.toFixed(2)}°E
              </div>
            </div>
          )}

          {/* View original */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(event.title.en)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.9rem] tracking-[0.5px] px-4 py-2 border rounded-xl inline-block transition-all duration-150 hover:brightness-110"
              style={{ color: "var(--accent-cyan)", borderColor: "var(--accent-cyan)", background: "var(--accent-cyan-dim)" }}
            >
              {t("news.viewOriginal")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
