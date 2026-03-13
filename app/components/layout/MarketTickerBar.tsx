"use client";

interface TickerItem {
  name: string;
  value: string;
  change: string;
  pct: string;
  direction: "up" | "down" | "flat";
  chartPoints: string;
  gradientId: string;
  chartColor: string;
  labels?: string[];
  openLabel?: string;
}

const TICKERS: TickerItem[] = [
  {
    name: "KOSPI", value: "2,648.32", change: "-28.15", pct: "-1.05%", direction: "down",
    chartPoints: "15,20 22,18 29,22 36,16 43,24 50,20 57,26 64,22 71,28 78,24 85,30 92,26 99,32 106,28 113,34 120,38 127,35 134,40 141,44 148,42 155,46",
    gradientId: "gKospi", chartColor: "#3b82f6", labels: ["09:00", "11:00", "13:00", "14:30"],
  },
  {
    name: "KOSDAQ", value: "842.56", change: "-12.34", pct: "-1.44%", direction: "down",
    chartPoints: "15,16 22,14 29,18 36,20 43,22 50,16 57,24 64,20 71,26 78,28 85,24 92,30 99,28 106,34 113,36 120,32 127,38 134,42 141,40 148,46 155,48",
    gradientId: "gKosdaq", chartColor: "#3b82f6", labels: ["09:00", "", "13:00", "14:30"],
  },
  {
    name: "S&P 500", value: "5,218.40", change: "-43.20", pct: "-0.82%", direction: "down",
    chartPoints: "15,22 22,18 29,14 36,20 43,16 50,22 57,18 64,24 71,20 78,26 85,22 92,28 99,32 106,28 113,34 120,30 127,36 134,38 141,34 148,40 155,38",
    gradientId: "gSP", chartColor: "#3b82f6", labels: ["09:30", "", "12:00", "15:00"],
  },
  {
    name: "NASDAQ", value: "16,384.12", change: "-156.80", pct: "-0.95%", direction: "down",
    chartPoints: "15,16 22,14 29,12 36,18 43,22 50,18 57,26 64,22 71,28 78,24 85,30 92,26 99,32 106,34 113,30 120,36 127,38 134,42 141,38 148,44 155,42",
    gradientId: "gNas", chartColor: "#3b82f6", labels: ["09:30", "", "12:00", "15:00"],
  },
  {
    name: "DOW", value: "39,142.50", change: "-180.30", pct: "-0.46%", direction: "down",
    chartPoints: "15,24 22,20 29,18 36,14 43,18 50,22 57,20 64,24 71,18 78,22 85,26 92,24 99,28 106,26 113,30 120,28 127,32 134,34 141,30 148,36 155,34",
    gradientId: "gDow", chartColor: "#3b82f6", labels: ["09:30", "", "12:00", "15:00"],
  },
  {
    name: "WTI", value: "$89.24", change: "+3.18", pct: "+3.69%", direction: "up",
    chartPoints: "15,48 22,46 29,44 36,42 43,40 50,38 57,36 64,34 71,30 78,28 85,32 92,26 99,24 106,20 113,22 120,18 127,16 134,14 141,12 148,10 155,8",
    gradientId: "gWti", chartColor: "#ef4444", labels: ["00:00", "06:00", "12:00", "18:00"],
    openLabel: "Open $86.06",
  },
  {
    name: "BRENT", value: "$93.56", change: "+3.42", pct: "+3.79%", direction: "up",
    chartPoints: "15,50 22,48 29,46 36,44 43,42 50,40 57,36 64,38 71,32 78,30 85,26 92,28 99,22 106,20 113,18 120,14 127,16 134,12 141,10 148,8 155,6",
    gradientId: "gBrent", chartColor: "#ef4444", labels: ["00:00", "", "12:00", "18:00"],
  },
  {
    name: "GOLD", value: "$2,385.60", change: "+28.40", pct: "+1.20%", direction: "up",
    chartPoints: "15,42 22,40 29,38 36,36 43,34 50,36 57,32 64,30 71,28 78,26 85,28 92,24 99,22 106,20 113,18 120,16 127,14 134,16 141,12 148,10 155,8",
    gradientId: "gGold", chartColor: "#f59e0b", labels: ["00:00", "", "12:00", "18:00"],
  },
  {
    name: "USD/KRW", value: "1,368.50", change: "+8.20", pct: "+0.60%", direction: "up",
    chartPoints: "15,38 22,36 29,34 36,36 43,32 50,30 57,32 64,28 71,26 78,28 85,24 92,22 99,24 106,20 113,18 120,16 127,18 134,14 141,16 148,12 155,10",
    gradientId: "gKrw", chartColor: "#ef4444", labels: ["09:00", "", "13:00", "15:30"],
  },
  {
    name: "BTC", value: "$67,240", change: "-1,280", pct: "-1.87%", direction: "down",
    chartPoints: "15,10 22,14 29,12 36,18 43,16 50,22 57,20 64,24 71,18 78,26 85,22 92,28 99,24 106,30 113,34 120,28 127,36 134,32 141,38 148,40 155,42",
    gradientId: "gBtc", chartColor: "#3b82f6", labels: ["00:00", "06:00", "12:00", "18:00"],
  },
  {
    name: "VIX", value: "22.45", change: "+3.80", pct: "+20.38%", direction: "up",
    chartPoints: "15,50 22,48 29,46 36,44 43,42 50,38 57,34 64,36 71,30 78,28 85,24 92,22 99,18 106,20 113,14 120,12 127,10 134,8 141,6 148,8 155,6",
    gradientId: "gVix", chartColor: "#ef4444", labels: ["09:30", "", "12:00", "15:00"],
    openLabel: "Open 18.65",
  },
];

function getLastPoint(points: string): { x: number; y: number } {
  const parts = points.split(" ");
  const last = parts[parts.length - 1];
  const [x, y] = last.split(",").map(Number);
  return { x, y };
}

export default function MarketTickerBar() {
  return (
    <div
      className="group flex items-stretch overflow-x-auto overflow-y-hidden border-b relative z-50"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
        scrollbarWidth: "none",
      }}
    >
      {TICKERS.map((t) => {
        const last = getLastPoint(t.chartPoints);
        const arrow = t.direction === "up" ? "\u25B2" : t.direction === "down" ? "\u25BC" : "";
        const changeColor =
          t.direction === "up" ? "var(--accent-red)" : t.direction === "down" ? "var(--accent-blue)" : "var(--text-muted)";

        return (
          <div
            key={t.name}
            className="flex flex-col justify-center px-4 py-[7px] border-r shrink-0 cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-card-hover)]"
            style={{ borderColor: "var(--border)", whiteSpace: "nowrap" }}
          >
            <div className="flex items-center gap-2 h-5">
              <span className="font-mono text-[0.62rem] tracking-[0.5px]" style={{ color: "var(--text-muted)" }}>
                {t.name}
              </span>
              <span className="font-mono text-[0.78rem] font-semibold" style={{ color: "var(--text-primary)" }}>
                {t.value}
              </span>
              <span className="font-mono text-[0.62rem] font-semibold" style={{ color: changeColor }}>
                {arrow} {t.change} ({t.pct})
              </span>
            </div>
            {/* Expandable chart */}
            <div
              className="overflow-hidden transition-all duration-400 max-h-0 opacity-0 mt-0 group-hover:max-h-[100px] group-hover:opacity-100 group-hover:mt-1.5"
              style={{ transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}
            >
              <svg width="160" height="72" viewBox="0 0 160 72">
                <defs>
                  <linearGradient id={t.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={t.chartColor} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={t.chartColor} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="15" y1="14" x2="155" y2="14" stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />
                <line x1="15" y1="32" x2="155" y2="32" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                <line x1="15" y1="50" x2="155" y2="50" stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />
                <polyline fill="none" stroke={t.chartColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={t.chartPoints} />
                <polyline fill={`url(#${t.gradientId})`} stroke="none" points={`${t.chartPoints} 155,60 15,60`} />
                <circle cx={last.x} cy={last.y} r="2.5" fill={t.chartColor}>
                  <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
                {t.labels &&
                  t.labels.map((label, i) =>
                    label ? (
                      <text
                        key={i}
                        x={18 + i * 42}
                        y="66"
                        fontFamily="var(--font-ibm-plex-mono)"
                        fontSize="5.5"
                        fill="#475569"
                      >
                        {label}
                      </text>
                    ) : null
                  )}
                <text
                  x={last.x}
                  y={last.y - 2}
                  fontFamily="var(--font-ibm-plex-mono)"
                  fontSize="6"
                  fontWeight="600"
                  fill={t.chartColor}
                  textAnchor="end"
                  dx="-4"
                >
                  {t.value}
                </text>
                {t.openLabel && (
                  <text x="18" y="49" fontFamily="var(--font-ibm-plex-mono)" fontSize="5" fill="#475569">
                    {t.openLabel}
                  </text>
                )}
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
