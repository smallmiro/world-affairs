"use client";

import { useState } from "react";
import { useGeoEvents } from "../../hooks/use-geo-events";
import { useLanguage } from "../../lib/language-context";
import { useT } from "../../hooks/use-t";
import SectionHeader from "../ui/SectionHeader";
import { aggregateByRegion, type RegionIssue } from "../../lib/geo-aggregation";
import type { Severity } from "../../lib/types";

type SortMode = "severity" | "latest";

const SEVERITY_COLORS: Record<number, { bar: string; glow: string }> = {
  5: { bar: "var(--accent-red)", glow: "var(--glow-red)" },
  4: { bar: "var(--accent-amber)", glow: "var(--glow-amber)" },
  3: { bar: "var(--accent-blue)", glow: "none" },
  2: { bar: "var(--text-muted)", glow: "none" },
};

const TREND_STYLES: Record<string, { color: string; arrow: string }> = {
  up: { color: "var(--accent-red)", arrow: "\u25B2" },
  stable: { color: "var(--accent-amber)", arrow: "\u25B6" },
  down: { color: "var(--accent-green)", arrow: "\u25BC" },
};

const SORT_BUTTONS: { key: string; mode: SortMode }[] = [
  { key: "issues.bySeverity", mode: "severity" },
  { key: "issues.byLatest", mode: "latest" },
];

function sortIssues(issues: RegionIssue[], mode: SortMode): RegionIssue[] {
  if (mode === "severity") return issues;
  return [...issues].sort(
    (a, b) => b.topEventDate.getTime() - a.topEventDate.getTime(),
  );
}

export default function IssueTracker() {
  const { lang } = useLanguage();
  const t = useT();
  const { data: events, isLoading } = useGeoEvents({ limit: 100 });
  const [sortMode, setSortMode] = useState<SortMode>("severity");

  const issues = events ? sortIssues(aggregateByRegion(events, lang), sortMode) : [];

  return (
    <section
      className="p-5"
      style={{ animation: "fade-in-up 0.4s ease-out 0.15s both" }}
    >
      <div className="mb-4">
        <SectionHeader
          title={t("issues.title")}
          accentColor="var(--accent-cyan)"
          controls={
            <div className="flex gap-1">
              {SORT_BUTTONS.map(({ key, mode }) => {
                const isActive = sortMode === mode;
                return (
                  <button
                    key={key}
                    onClick={() => setSortMode(mode)}
                    className="font-mono text-[0.85rem] tracking-[0.5px] px-3 py-2 border cursor-pointer transition-all duration-150"
                    style={{
                      color: isActive ? "var(--accent-cyan)" : "var(--text-muted)",
                      borderColor: isActive ? "var(--accent-cyan)" : "var(--border)",
                      background: isActive ? "var(--accent-cyan-dim)" : "transparent",
                    }}
                  >
                    {t(key)}
                  </button>
                );
              })}
            </div>
          }
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="font-mono text-[0.72rem]" style={{ color: "var(--text-muted)" }}>{t("common.loading")}</span>
        </div>
      ) : issues.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <span className="font-mono text-[0.72rem]" style={{ color: "var(--text-muted)" }}>{t("common.noData")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-lg:grid-cols-2">
          {issues.slice(0, 4).map((issue) => {
            const sev = SEVERITY_COLORS[issue.severityLevel] ?? SEVERITY_COLORS[3];
            const trend = TREND_STYLES[issue.trend];

            return (
              <div
                key={issue.region}
                className="issue-card-item relative overflow-hidden p-3.5 border cursor-pointer transition-all duration-200 hover:-translate-y-px"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: sev.bar, boxShadow: sev.glow }}
                />

                <div className="font-mono text-[0.75rem] tracking-[1.5px] uppercase mb-1.5" style={{ color: "var(--text-muted)" }}>
                  {issue.regionLabel}
                </div>
                <div className="text-[0.88rem] font-bold mb-2.5 line-clamp-2" style={{ color: "var(--text-primary)" }}>
                  {issue.name}
                </div>

                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-[3px]"
                      style={{
                        background: i < issue.severityLevel ? sev.bar : "var(--border)",
                      }}
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-mono text-[0.7rem] font-semibold" style={{ color: trend.color }}>
                    {trend.arrow} {issue.trendLabel}
                  </span>
                  <span className="font-mono text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                    {issue.countries}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
