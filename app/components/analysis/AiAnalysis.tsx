"use client";

import { useMemo } from "react";
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

export default function AiAnalysis() {
  const { lang } = useLanguage();
  const t = useT();
  const { data: events } = useGeoEvents({ limit: 100 });
  const { data: briefing } = useBriefing();

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
      className="grid grid-cols-3 gap-4 max-lg:grid-cols-1"
      style={{
        animation: "fade-in-up 0.4s ease-out 0.3s both",
      }}
    >
      {/* Sentiment */}
      <div className="p-4" style={{ minHeight: 320 }}>
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
              <div key={s.region} className="flex items-center gap-2.5 mb-2.5">
                <span className="font-mono text-[0.85rem] w-[70px]" style={{ color: "var(--text-secondary)" }}>
                  {s.label}
                </span>
                <div className="flex-1 h-1 relative" style={{ background: "var(--border)" }}>
                  <div
                    className="absolute left-0 top-0 h-full"
                    style={{
                      width: `${s.value}%`,
                      background: style.gradient,
                    }}
                  />
                </div>
                <span className="font-mono text-[0.85rem] w-[35px] text-right" style={{ color: valueColor }}>
                  {s.type === "positive" ? "+" : "-"}{s.value}
                </span>
              </div>
            );
          })
        )}
        {/* Legend */}
        <div className="mt-3 pt-2 border-t flex flex-col gap-1" style={{ borderColor: "var(--border)" }}>
          <div className="font-mono text-[0.7rem] tracking-[0.5px]" style={{ color: "var(--text-muted)" }}>
            {t("analysis.tensionIndex")}
          </div>
          <div className="flex gap-3 font-mono text-[0.7rem]">
            <span style={{ color: "var(--accent-red)" }}>■ {t("analysis.danger")}</span>
            <span style={{ color: "var(--accent-amber)" }}>■ {t("analysis.caution")}</span>
            <span style={{ color: "var(--accent-blue)" }}>■ {t("analysis.watch")}</span>
            <span style={{ color: "var(--accent-green)" }}>■ {t("analysis.stable")}</span>
          </div>
          <div className="font-mono text-[0.7rem] leading-[1.4]" style={{ color: "var(--text-muted)" }}>
            분쟁=90 군사훈련=75 시위=65 제재=60 인도위기=70 무역분쟁=40 외교=20
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="p-4" style={{ minHeight: 320 }}>
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

      {/* AI Briefing */}
      <div className="p-4">
        <h3 className="font-mono text-[0.95rem] tracking-[2px] uppercase mb-3.5 flex items-center gap-1.5" style={{ color: "var(--accent-purple)" }}>
          <span
            className="w-1.5 h-1.5"
            style={{
              background: "var(--accent-purple)",
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
            }}
          />
          {t("analysis.briefing")}
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
    </section>
  );
}
