"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useGeoEvents } from "../../hooks/use-geo-events";
import { useBriefing } from "../../hooks/use-briefing";
import { useLanguage } from "../../lib/language-context";
import { useT } from "../../hooks/use-t";
import { computeRegionSentiment } from "../../lib/geo-aggregation";
import { getTranslatedText } from "../../lib/display-mappers";
import { aggregateTrend } from "../../lib/trend-aggregation";
import TrendChart from "./TrendChart";
import ReactMarkdown from "react-markdown";

const SENTIMENT_COLORS = {
  negative: { gradient: "linear-gradient(90deg,var(--accent-red),var(--accent-amber))", color: "var(--accent-red)" },
  mixed: { gradient: "linear-gradient(90deg,var(--accent-amber),var(--accent-blue))", color: "var(--accent-blue)" },
  positive: { gradient: "linear-gradient(90deg,var(--accent-green),var(--accent-cyan))", color: "var(--accent-green)" },
} as const;

function BriefingFullscreen({ text, onClose, closeLabel }: { text: string; onClose: () => void; closeLabel: string }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[2000] flex flex-col overflow-hidden"
      style={{ background: "var(--bg-primary)", animation: "fade-in-up 0.15s ease-out" }}
    >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 md:px-10 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2"
              style={{
                background: "var(--accent-purple)",
                clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
              }}
            />
            <span
              className="font-mono text-[0.85rem] md:text-[1rem] font-bold tracking-[2px] uppercase"
              style={{ color: "var(--accent-purple)" }}
            >
              AI DAILY BRIEFING
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="w-9 h-9 grid place-items-center border rounded cursor-pointer transition-all duration-200 hover:border-[var(--accent-purple)]"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
              background: "transparent",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-purple)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div
          className="flex-1 overflow-y-auto px-6 md:px-10 py-8"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--border-active) transparent",
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div
              className="briefing-markdown font-mono text-[1rem] md:text-[1.15rem] leading-[2] md:leading-[2.2]"
              style={{ color: "var(--text-secondary)" }}
            >
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          </div>
        </div>
        {/* Footer accent line */}
        <div className="h-[2px] shrink-0" style={{ background: "linear-gradient(90deg, var(--accent-purple), var(--accent-cyan), var(--accent-purple))" }} />
    </div>
  );
}

export default function AiAnalysis() {
  const { lang } = useLanguage();
  const t = useT();
  const { data: events } = useGeoEvents({ limit: 1000 });
  const { data: briefing } = useBriefing();
  const [fullscreen, setFullscreen] = useState(false);
  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  const sentimentRows = useMemo(
    () => computeRegionSentiment(events ?? []).slice(0, 6),
    [events],
  );

  const trendData = useMemo(
    () => aggregateTrend(events ?? []),
    [events],
  );

  const briefingText = briefing ? getTranslatedText(briefing.result, lang) : null;

  return (
    <section
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      style={{
        animation: "fade-in-up 0.4s ease-out 0.3s both",
      }}
    >
      {/* Sentiment */}
      <div className="p-4 min-h-[280px] md:min-h-[400px]">
        <h3 className="font-mono text-[0.95rem] tracking-[2px] uppercase mb-3.5 flex items-center gap-1.5" style={{ color: "var(--accent-purple)" }}>
          <span
            className="w-1.5 h-1.5"
            style={{
              background: "var(--accent-purple)",
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
            }}
          />
          {t("analysis.sentiment")}
        </h3>
        {sentimentRows.length === 0 ? (
          <div className="font-mono text-[0.85rem]" style={{ color: "var(--text-muted)" }}>NO DATA</div>
        ) : (
          sentimentRows.map((s) => {
            const style = SENTIMENT_COLORS[s.type];
            const valueColor = s.value >= 60 ? "var(--accent-red)" : s.value >= 40 ? "var(--accent-amber)" : s.value >= 20 ? "var(--accent-blue)" : "var(--accent-green)";
            return (
              <div key={s.region} className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[0.9rem] w-[80px]" style={{ color: "var(--text-secondary)" }}>
                  {s.label}
                </span>
                <div className="flex-1 h-3 relative rounded-full" style={{ background: "var(--border)" }}>
                  <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{
                      width: `${s.value}%`,
                      background: style.gradient,
                    }}
                  />
                </div>
                <span className="font-mono text-[0.95rem] font-bold w-[40px] text-right" style={{ color: valueColor }}>
                  {s.type === "positive" ? "+" : "-"}{s.value}
                </span>
              </div>
            );
          })
        )}
        {/* Legend */}
        <div className="mt-3 pt-2 border-t flex flex-col gap-1.5" style={{ borderColor: "var(--border)" }}>
          <div className="font-mono text-[0.8rem] tracking-[0.5px]" style={{ color: "var(--text-muted)" }}>
            {t("analysis.tensionIndex")}
          </div>
          <div className="flex gap-3 font-mono text-[0.8rem]">
            <span style={{ color: "var(--accent-red)" }}>■ {t("analysis.danger")}</span>
            <span style={{ color: "var(--accent-amber)" }}>■ {t("analysis.caution")}</span>
            <span style={{ color: "var(--accent-blue)" }}>■ {t("analysis.watch")}</span>
            <span style={{ color: "var(--accent-green)" }}>■ {t("analysis.stable")}</span>
          </div>
          <div className="font-mono text-[0.75rem] leading-[1.5]" style={{ color: "var(--text-muted)" }}>
            분쟁=90 군사훈련=75 시위=65 제재=60 인도위기=70 무역분쟁=40 외교=20
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="p-4 min-h-[280px] md:min-h-[400px]">
        <h3 className="font-mono text-[0.95rem] tracking-[2px] uppercase mb-3.5 flex items-center gap-1.5" style={{ color: "var(--accent-purple)" }}>
          <span
            className="w-1.5 h-1.5"
            style={{
              background: "var(--accent-purple)",
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
            }}
          />
          {t("analysis.trend")}
        </h3>
        <TrendChart data={trendData} />
      </div>

      {/* AI Briefing — md에서 2col일 때 전체 폭 사용 */}
      <div className="p-4 md:col-span-2 lg:col-span-1">
        <h3 className="font-mono text-[0.95rem] tracking-[2px] uppercase mb-3.5 flex items-center gap-1.5" style={{ color: "var(--accent-purple)" }}>
          <span
            className="w-1.5 h-1.5"
            style={{
              background: "var(--accent-purple)",
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
            }}
          />
          {t("analysis.briefing")}
          {briefingText && (
            <button
              onClick={() => setFullscreen(true)}
              aria-label={t("analysis.fullscreen")}
              className="ml-auto w-8 h-8 grid place-items-center border rounded cursor-pointer transition-all duration-200 hover:border-[var(--accent-purple)]"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-muted)",
                background: "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-purple)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          )}
        </h3>
        {briefingText ? (
          <div
            className="px-3 py-2.5 border-l-2 overflow-y-auto"
            style={{
              borderColor: "var(--accent-purple)",
              background: "rgba(168,85,247,0.04)",
              maxHeight: 320,
              scrollbarWidth: "thin",
              scrollbarColor: "var(--border-active) transparent",
            }}
          >
            <div className="font-mono text-[0.75rem] tracking-[1px] mb-2" style={{ color: "var(--accent-purple)" }}>
              DAILY BRIEFING
            </div>
            <div className="briefing-markdown text-[0.75rem] leading-[1.7]" style={{ color: "var(--text-secondary)" }}>
              <ReactMarkdown>{briefingText}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="font-mono text-[0.85rem]" style={{ color: "var(--text-muted)" }}>
            {t("analysis.noBriefing")}
          </div>
        )}
      </div>

      {/* Fullscreen Briefing Modal — portal to body */}
      {fullscreen && briefingText && createPortal(
        <BriefingFullscreen
          text={briefingText}
          onClose={closeFullscreen}
          closeLabel={t("analysis.close")}
        />,
        document.body,
      )}
    </section>
  );
}
