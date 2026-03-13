"use client";

interface Issue {
  region: string;
  name: string;
  severity: number;
  trend: "up" | "stable" | "down";
  trendLabel: string;
  countries: string;
}

const ISSUES: Issue[] = [
  { region: "MIDDLE EAST", name: "중동 분쟁 확전", severity: 5, trend: "up", trendLabel: "급상승", countries: "IR, YE, IL +4" },
  { region: "EAST EUROPE", name: "러-우 전쟁", severity: 4, trend: "stable", trendLabel: "유지", countries: "RU, UA, NATO" },
  { region: "EAST ASIA", name: "대만 해협 긴장", severity: 4, trend: "up", trendLabel: "상승", countries: "CN, TW, US" },
  { region: "SE ASIA", name: "남중국해 영유권", severity: 3, trend: "stable", trendLabel: "유지", countries: "CN, PH, VN" },
];

const SEVERITY_COLORS: Record<number, { bar: string; glow: string }> = {
  5: { bar: "var(--accent-red)", glow: "var(--glow-red)" },
  4: { bar: "var(--accent-amber)", glow: "var(--glow-amber)" },
  3: { bar: "var(--accent-blue)", glow: "none" },
};

const TREND_STYLES: Record<string, { color: string; arrow: string }> = {
  up: { color: "var(--accent-red)", arrow: "\u25B2" },
  stable: { color: "var(--accent-amber)", arrow: "\u25B6" },
  down: { color: "var(--accent-green)", arrow: "\u25BC" },
};

export default function IssueTracker() {
  return (
    <section
      className="p-5"
      style={{ animation: "fade-in-up 0.4s ease-out 0.15s both" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2"
            style={{ background: "var(--accent-cyan)", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }}
          />
          <h2 className="font-mono text-[0.72rem] font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>
            이슈 트래커
          </h2>
        </div>
        <div className="flex gap-1">
          {["심각도순", "최신순"].map((label, i) => (
            <button
              key={label}
              className="font-mono text-[0.62rem] tracking-[0.5px] px-2 py-[3px] border cursor-pointer transition-all duration-150"
              style={{
                color: i === 0 ? "var(--accent-cyan)" : "var(--text-muted)",
                borderColor: i === 0 ? "var(--accent-cyan)" : "var(--border)",
                background: i === 0 ? "var(--accent-cyan-dim)" : "transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 max-lg:grid-cols-2">
        {ISSUES.map((issue) => {
          const sev = SEVERITY_COLORS[issue.severity] ?? SEVERITY_COLORS[3];
          const trend = TREND_STYLES[issue.trend];

          return (
            <div
              key={issue.name}
              className="issue-card-item relative overflow-hidden p-3.5 border cursor-pointer transition-all duration-200 hover:-translate-y-px"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
              }}
            >
              {/* Bottom severity bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: sev.bar, boxShadow: sev.glow }}
              />

              <div className="font-mono text-[0.55rem] tracking-[1.5px] uppercase mb-1.5" style={{ color: "var(--text-muted)" }}>
                {issue.region}
              </div>
              <div className="text-[0.88rem] font-bold mb-2.5" style={{ color: "var(--text-primary)" }}>
                {issue.name}
              </div>

              {/* Severity segments */}
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-[3px]"
                    style={{
                      background: i < issue.severity ? sev.bar : "var(--border)",
                    }}
                  />
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className="font-mono text-[0.7rem] font-semibold" style={{ color: trend.color }}>
                  {trend.arrow} {issue.trendLabel}
                </span>
                <span className="font-mono text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                  {issue.countries}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
