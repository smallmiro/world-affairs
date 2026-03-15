"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "../../lib/language-context";

interface AirportAssessment {
  status: "OPERATIONAL" | "CAUTION" | "DISRUPTED";
  light: "green" | "amber" | "red";
  riskScore: number;
  summary: { en: string; ko: string; ja: string };
  factors: { text: { en: string; ko: string }; impact: "positive" | "negative" | "neutral" }[];
  recommendation: { en: string; ko: string; ja: string };
}

async function fetchAssessment(): Promise<AirportAssessment | null> {
  const res = await fetch("/api/airport/assessment");
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

const STATUS_COLORS: Record<string, string> = {
  green: "var(--accent-green)",
  amber: "var(--accent-amber)",
  red: "var(--accent-red)",
};

const IMPACT_ICON: Record<string, { symbol: string; color: string }> = {
  negative: { symbol: "▼", color: "var(--accent-red)" },
  positive: { symbol: "▲", color: "var(--accent-green)" },
  neutral: { symbol: "●", color: "var(--accent-cyan)" },
};

interface AlertPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function AlertPanel({ open, onClose }: AlertPanelProps) {
  const { lang } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: assessment } = useQuery({
    queryKey: ["airport-assessment"],
    queryFn: fetchAssessment,
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  const getText = (t: { en: string; ko: string; ja?: string }) => {
    if (lang === "ja" && t.ja) return t.ja;
    if (lang === "en") return t.en;
    return t.ko;
  };

  const statusColor = assessment ? STATUS_COLORS[assessment.light] ?? "var(--text-muted)" : "var(--text-muted)";

  return (
    <div
      ref={panelRef}
      className="fixed z-[2000] border overflow-hidden"
      style={{
        top: 52,
        right: "clamp(16px, 24px, 5vw)",
        width: "min(420px, calc(100vw - 32px))",
        maxHeight: "calc(100vh - 70px)",
        background: "var(--bg-card)",
        borderColor: "var(--border-active)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        animation: "fade-in-up 0.2s ease-out",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: statusColor }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span
            className="font-mono text-[0.72rem] font-bold tracking-[2px]"
            style={{ color: statusColor }}
          >
            ALERT
          </span>
          {assessment && (
            <span
              className="font-mono text-[0.6rem] font-semibold tracking-[1px] px-1.5 py-0.5"
              style={{
                color: statusColor,
                background: `${statusColor}15`,
                borderRadius: 4,
              }}
            >
              {assessment.status}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 grid place-items-center rounded cursor-pointer transition-colors duration-150"
          style={{ color: "var(--text-muted)" }}
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 130px)" }}>
        {!assessment ? (
          <div className="py-6 text-center font-mono text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
            NO DATA
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Risk Score */}
            <div className="flex items-center gap-3 px-3 py-2" style={{ background: "var(--bg-secondary)", borderRadius: 8 }}>
              <span className="font-mono text-[0.65rem] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
                RISK
              </span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${assessment.riskScore}%`,
                    background: statusColor,
                    boxShadow: `0 0 8px ${statusColor}`,
                  }}
                />
              </div>
              <span className="font-mono text-[0.72rem] font-bold" style={{ color: statusColor }}>
                {assessment.riskScore}
              </span>
            </div>

            {/* Summary */}
            <div
              className="font-mono text-[0.72rem] leading-relaxed px-3 py-2"
              style={{ color: "var(--text-secondary)", background: "var(--bg-secondary)", borderRadius: 8 }}
            >
              {getText(assessment.summary)}
            </div>

            {/* Factors */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[0.6rem] tracking-[2px] uppercase" style={{ color: "var(--text-muted)" }}>
                FACTORS
              </span>
              {assessment.factors.map((f, i) => {
                const icon = IMPACT_ICON[f.impact] ?? IMPACT_ICON.neutral;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 px-3 py-2.5 border"
                    style={{
                      borderColor: "var(--border)",
                      borderRadius: 8,
                      background: f.impact === "negative" ? "var(--accent-red-dim)" : f.impact === "positive" ? "var(--accent-green-dim)" : "transparent",
                    }}
                  >
                    <span className="font-mono text-[0.8rem] mt-px" style={{ color: icon.color }}>
                      {icon.symbol}
                    </span>
                    <span className="font-mono text-[0.72rem] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {getText(f.text)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Recommendation */}
            <div
              className="flex items-start gap-2 px-3 py-2.5 border"
              style={{ borderColor: "var(--accent-amber)", borderRadius: 8, background: "var(--accent-amber-dim)" }}
            >
              <span className="font-mono text-[0.72rem] mt-px" style={{ color: "var(--accent-amber)" }}>
                ⚠
              </span>
              <span className="font-mono text-[0.72rem] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {getText(assessment.recommendation)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
