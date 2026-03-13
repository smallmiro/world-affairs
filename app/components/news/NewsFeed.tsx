"use client";

import { useState } from "react";

interface NewsItem {
  severity: "critical" | "warning" | "info";
  time: string;
  category: string;
  title: string;
  source: string;
}

const NEWS_DATA: NewsItem[] = [
  { severity: "critical", time: "14:28", category: "군사/안보", title: "이란 IRGC, 호르무즈 해협 일대 대규모 해군 훈련 개시 — 미 제5함대 경계 태세 격상", source: "Reuters · AP" },
  { severity: "critical", time: "13:45", category: "군사/안보", title: "후티 반군, 홍해 통과 상선 대상 드론 공격 재개 — 바브엘만데브 해협 보험료 급등", source: "Al Jazeera · Bloomberg" },
  { severity: "warning", time: "12:30", category: "외교", title: "UN 안보리 긴급회의 소집 — 중동 정세 논의, 러시아-중국 거부권 가능성", source: "UN News · BBC" },
  { severity: "warning", time: "11:15", category: "경제/무역", title: "국제유가 WTI $89 돌파 — 중동 불안정에 따른 공급 차질 우려 확산", source: "CNBC · Financial Times" },
  { severity: "info", time: "10:40", category: "외교", title: "미-중 외교장관 전화 회담 — 대만 해협 긴장 완화 방안 논의", source: "Reuters · Xinhua" },
  { severity: "info", time: "09:20", category: "군사/안보", title: "NATO 동부전선 병력 증강 완료 — 발트해 연안 방어 태세 강화", source: "NATO · Defense One" },
  { severity: "info", time: "08:55", category: "경제/무역", title: "EU-인도 FTA 협상 3라운드 개시 — 디지털 무역 규범 핵심 의제", source: "European Commission" },
  { severity: "info", time: "07:30", category: "환경", title: "COP31 사전협의 — 개도국 기후기금 규모 합의 난항", source: "UNFCCC · Guardian" },
];

const SEVERITY_STYLES = {
  critical: { color: "var(--accent-red)", bg: "var(--accent-red-dim)", bar: "var(--accent-red)" },
  warning: { color: "var(--accent-amber)", bg: "var(--accent-amber-dim)", bar: "var(--accent-amber)" },
  info: { color: "var(--accent-blue)", bg: "var(--accent-blue-dim)", bar: "var(--accent-blue)" },
};

const SEVERITY_LABELS = { critical: "CRITICAL", warning: "WARNING", info: "INFO" };

const FILTERS = ["전체", "외교", "군사", "경제", "에너지"];

export default function NewsFeed() {
  const [activeFilter, setActiveFilter] = useState("전체");

  return (
    <section
      className="p-5 flex flex-col max-h-[700px]"
      style={{ animation: "fade-in-up 0.4s ease-out 0.1s both" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2"
            style={{ background: "var(--accent-cyan)", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }}
          />
          <h2 className="font-mono text-[0.72rem] font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>
            실시간 뉴스
          </h2>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap mb-3">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="font-mono text-[0.62rem] tracking-[0.5px] px-2 py-[3px] border cursor-pointer transition-all duration-150"
            style={{
              color: activeFilter === f ? "var(--accent-cyan)" : "var(--text-muted)",
              borderColor: activeFilter === f ? "var(--accent-cyan)" : "var(--border)",
              background: activeFilter === f ? "var(--accent-cyan-dim)" : "transparent",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-0.5">
        {NEWS_DATA.filter(
          (item) => activeFilter === "전체" || item.category.includes(activeFilter)
        ).map((item, i) => {
          const s = SEVERITY_STYLES[item.severity];
          return (
            <div
              key={i}
              className="news-item-card relative pl-3 pr-3 py-3 border cursor-pointer transition-all duration-150"
            >
              {/* Left severity bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{ background: s.bar }}
              />

              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="font-mono text-[0.55rem] font-bold tracking-[1px] px-1.5 py-px uppercase"
                  style={{ color: s.color, background: s.bg }}
                >
                  {SEVERITY_LABELS[item.severity]}
                </span>
                <span className="font-mono text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                  {item.time}
                </span>
                <span className="font-mono text-[0.55rem] tracking-[0.5px] ml-auto" style={{ color: "var(--text-muted)" }}>
                  {item.category}
                </span>
              </div>

              <div className="text-[0.82rem] font-medium leading-[1.4] mb-1" style={{ color: "var(--text-primary)" }}>
                {item.title}
              </div>
              <div className="font-mono text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                {item.source}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
