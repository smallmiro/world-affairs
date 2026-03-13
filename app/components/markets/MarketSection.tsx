"use client";

interface MarketCard {
  name: string;
  price: string;
  change: string;
  pct: string;
  direction: "up" | "down";
  chartPoints: string;
}

const STOCK_CARDS: MarketCard[] = [
  { name: "KOSPI", price: "2,648.32", change: "-28.15", pct: "-1.05%", direction: "down", chartPoints: "0,12 10,10 20,14 30,8 40,16 50,20 60,18 70,22 80,24 90,20 100,26 110,30 120,28" },
  { name: "KOSDAQ", price: "842.56", change: "-12.34", pct: "-1.44%", direction: "down", chartPoints: "0,8 10,6 20,10 30,12 40,14 50,10 60,16 70,20 80,18 90,24 100,28 110,26 120,30" },
  { name: "S&P 500", price: "5,218.40", change: "-43.20", pct: "-0.82%", direction: "down", chartPoints: "0,14 10,10 20,8 30,12 40,10 50,14 60,16 70,12 80,18 90,22 100,20 110,26 120,24" },
  { name: "NASDAQ", price: "16,384.12", change: "-156.80", pct: "-0.95%", direction: "down", chartPoints: "0,10 10,8 20,6 30,10 40,14 50,12 60,18 70,16 80,20 90,24 100,22 110,28 120,26" },
  { name: "DOW JONES", price: "39,142.50", change: "-180.30", pct: "-0.46%", direction: "down", chartPoints: "0,16 10,14 20,12 30,10 40,14 50,16 60,14 70,18 80,16 90,20 100,22 110,24 120,22" },
  { name: "NIKKEI 225", price: "38,420.80", change: "-310.50", pct: "-0.80%", direction: "down", chartPoints: "0,12 10,14 20,10 30,8 40,12 50,16 60,14 70,18 80,22 90,20 100,24 110,28 120,26" },
];

interface Commodity {
  name: string;
  unit: string;
  price: string;
  change: string;
  pct: string;
  direction: "up" | "down";
}

const COMMODITIES: Commodity[] = [
  { name: "WTI 원유", unit: "USD/bbl", price: "89.24", change: "+3.18", pct: "+3.69%", direction: "up" },
  { name: "브렌트유", unit: "USD/bbl", price: "93.56", change: "+3.42", pct: "+3.79%", direction: "up" },
  { name: "두바이유", unit: "USD/bbl", price: "91.80", change: "+3.05", pct: "+3.44%", direction: "up" },
  { name: "천연가스", unit: "USD/MMBtu", price: "3.82", change: "+0.14", pct: "+3.80%", direction: "up" },
  { name: "금 (Gold)", unit: "USD/oz", price: "2,385.60", change: "+28.40", pct: "+1.20%", direction: "up" },
  { name: "은 (Silver)", unit: "USD/oz", price: "28.92", change: "+0.48", pct: "+1.69%", direction: "up" },
  { name: "구리 (Copper)", unit: "USD/lb", price: "4.28", change: "-0.03", pct: "-0.70%", direction: "down" },
  { name: "USD/KRW", unit: "원/달러", price: "1,368.50", change: "+8.20", pct: "+0.60%", direction: "up" },
  { name: "EUR/USD", unit: "유로/달러", price: "1.0842", change: "-0.0028", pct: "-0.26%", direction: "down" },
  { name: "USD/JPY", unit: "엔/달러", price: "154.82", change: "+0.95", pct: "+0.62%", direction: "up" },
  { name: "VIX", unit: "공포지수", price: "22.45", change: "+3.80", pct: "+20.38%", direction: "up" },
];

export default function MarketSection() {
  return (
    <section
      className="grid grid-cols-2 gap-px max-lg:grid-cols-1"
      style={{
        background: "var(--border)",
        animation: "fade-in-up 0.4s ease-out 0.25s both",
      }}
    >
      {/* Stock market */}
      <div className="p-5" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2" style={{ background: "var(--accent-amber)", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }} />
            <h2 className="font-mono text-[0.72rem] font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>
              주식 시장
            </h2>
          </div>
          <div className="flex gap-1">
            {["주요지수", "섹터"].map((label, i) => (
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

        <div className="grid grid-cols-3 gap-2">
          {STOCK_CARDS.map((card) => {
            const color = card.direction === "up" ? "var(--accent-red)" : "var(--accent-blue)";
            const arrow = card.direction === "up" ? "\u25B2" : "\u25BC";
            return (
              <div
                key={card.name}
                className="p-3.5 border cursor-pointer transition-all duration-200 hover:border-[var(--border-active)]"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-[0.6rem] tracking-[1px] uppercase" style={{ color: "var(--text-muted)" }}>
                    {card.name}
                  </span>
                </div>
                <div className="font-mono text-[1.15rem] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                  {card.price}
                </div>
                <div className="font-mono text-[0.68rem] font-semibold flex items-center gap-1.5" style={{ color }}>
                  {arrow} {card.change}{" "}
                  <span className="px-1 py-px text-[0.6rem]" style={{ background: card.direction === "up" ? "var(--accent-red-dim)" : "var(--accent-blue-dim)" }}>
                    {card.pct}
                  </span>
                </div>
                <div className="mt-2.5 h-9">
                  <svg viewBox="0 0 120 36" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id={`grad-${card.name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color === "var(--accent-red)" ? "#ef4444" : "#3b82f6"} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={color === "var(--accent-red)" ? "#ef4444" : "#3b82f6"} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline points={card.chartPoints} fill="none" stroke={color === "var(--accent-red)" ? "#ef4444" : "#3b82f6"} strokeWidth="1.5" />
                    <polyline points={`${card.chartPoints} 120,36 0,36`} fill={`url(#grad-${card.name})`} stroke="none" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commodities table */}
      <div className="p-5" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2" style={{ background: "var(--accent-amber)", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }} />
            <h2 className="font-mono text-[0.72rem] font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>
              원자재 · 현물 · 환율
            </h2>
          </div>
          <div className="flex gap-1">
            {["전체", "에너지", "귀금속", "환율"].map((label, i) => (
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

        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["종목", "가격", "변동", "등락률"].map((th, i) => (
                <th
                  key={th}
                  className="font-mono text-[0.55rem] tracking-[1px] uppercase py-1.5 px-2.5 border-b"
                  style={{
                    color: "var(--text-muted)",
                    borderColor: "var(--border)",
                    textAlign: i >= 2 ? "right" : "left",
                  }}
                >
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMMODITIES.map((c) => {
              const color = c.direction === "up" ? "var(--accent-red)" : "var(--accent-blue)";
              const isVix = c.name === "VIX";
              return (
                <tr
                  key={c.name}
                  className="transition-colors duration-100 hover:bg-[var(--bg-secondary)]"
                >
                  <td className="font-mono text-[0.75rem] py-2 px-2.5 border-b" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
                    <span className="text-[0.7rem]" style={{ color: "var(--text-secondary)" }}>{c.name}</span>
                    <span className="text-[0.55rem] ml-1" style={{ color: "var(--text-muted)" }}>{c.unit}</span>
                  </td>
                  <td
                    className="font-mono text-[0.75rem] py-2 px-2.5 border-b font-semibold"
                    style={{
                      borderColor: "var(--border)",
                      color: isVix ? "var(--accent-red)" : "var(--text-primary)",
                    }}
                  >
                    {c.price}
                  </td>
                  <td className="font-mono text-[0.75rem] py-2 px-2.5 border-b text-right" style={{ borderColor: "var(--border)", color }}>
                    {c.change}
                  </td>
                  <td
                    className="font-mono text-[0.75rem] py-2 px-2.5 border-b text-right"
                    style={{
                      borderColor: "var(--border)",
                      color,
                      fontWeight: isVix ? 700 : undefined,
                    }}
                  >
                    {c.pct}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
