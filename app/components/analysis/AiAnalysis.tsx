"use client";

interface SentimentRow {
  region: string;
  value: number;
  type: "negative" | "mixed" | "positive";
}

const SENTIMENTS: SentimentRow[] = [
  { region: "중동", value: 82, type: "negative" },
  { region: "동유럽", value: 68, type: "negative" },
  { region: "동아시아", value: 55, type: "mixed" },
  { region: "북미", value: 30, type: "mixed" },
  { region: "유럽", value: 38, type: "mixed" },
  { region: "남미", value: 15, type: "positive" },
];

const SENTIMENT_COLORS = {
  negative: { gradient: "linear-gradient(90deg,var(--accent-red),var(--accent-amber))", color: "var(--accent-red)" },
  mixed: { gradient: "linear-gradient(90deg,var(--accent-amber),var(--accent-blue))", color: "var(--accent-blue)" },
  positive: { gradient: "linear-gradient(90deg,var(--accent-green),var(--accent-cyan))", color: "var(--accent-green)" },
};

const BRIEFINGS = [
  {
    tag: "PRIORITY ASSESSMENT",
    text: "이란 해군 훈련으로 인해 호르무즈 해협 통과 유조선 수가 12% 감소. 유가 상승 압력과 함께 LPG 스팟 가격 3.2% 상승. 홍해 우회 선박 증가세 지속 시 글로벌 에너지 물류 비용 추가 상승 전망.",
  },
  {
    tag: "SCENARIO WATCH",
    text: "후티 반군의 홍해 공격 재개 시 바브엘만데브 해협 사실상 봉쇄 가능성. 아프리카 희망봉 우회 항로 전환 시 운송 기간 7~14일 추가 소요 예상.",
  },
];

export default function AiAnalysis() {
  return (
    <section
      className="grid grid-cols-3 gap-px max-lg:grid-cols-1"
      style={{
        background: "var(--border)",
        animation: "fade-in-up 0.4s ease-out 0.3s both",
      }}
    >
      {/* Sentiment */}
      <div className="p-5" style={{ background: "var(--bg-primary)" }}>
        <h3 className="font-mono text-[0.65rem] tracking-[2px] uppercase mb-3.5 flex items-center gap-1.5" style={{ color: "var(--accent-purple)" }}>
          <span
            className="w-1.5 h-1.5"
            style={{
              background: "var(--accent-purple)",
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
            }}
          />
          감성 분석
        </h3>
        {SENTIMENTS.map((s) => {
          const style = SENTIMENT_COLORS[s.type];
          const valueColor = s.value >= 60 ? "var(--accent-red)" : s.value >= 40 ? "var(--accent-amber)" : s.value >= 20 ? "var(--accent-blue)" : "var(--accent-green)";
          return (
            <div key={s.region} className="flex items-center gap-2.5 mb-2.5">
              <span className="font-mono text-[0.68rem] w-[70px]" style={{ color: "var(--text-secondary)" }}>
                {s.region}
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
              <span className="font-mono text-[0.65rem] w-[35px] text-right" style={{ color: valueColor }}>
                {s.type === "positive" ? "+" : "-"}{s.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="p-5" style={{ background: "var(--bg-primary)" }}>
        <h3 className="font-mono text-[0.65rem] tracking-[2px] uppercase mb-3.5 flex items-center gap-1.5" style={{ color: "var(--accent-purple)" }}>
          <span
            className="w-1.5 h-1.5"
            style={{
              background: "var(--accent-purple)",
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
            }}
          />
          이슈 트렌드 (7일)
        </h3>
        <div className="w-full h-[120px]">
          <svg viewBox="0 0 300 120" className="w-full h-full">
            {/* Axes */}
            <line x1="30" y1="10" x2="30" y2="100" stroke="#1e293b" strokeWidth="0.5" />
            <line x1="30" y1="100" x2="290" y2="100" stroke="#1e293b" strokeWidth="0.5" />
            <line x1="30" y1="70" x2="290" y2="70" stroke="#1e293b" strokeWidth="0.3" strokeDasharray="2 4" />
            <line x1="30" y1="40" x2="290" y2="40" stroke="#1e293b" strokeWidth="0.3" strokeDasharray="2 4" />

            {/* Date labels */}
            {["3/7", "3/8", "3/9", "3/10", "3/11", "3/12"].map((d, i) => (
              <text key={d} x={67 + i * 43} y="112" fontFamily="var(--font-ibm-plex-mono)" fontSize="6" fill="#475569" textAnchor="middle">
                {d}
              </text>
            ))}

            {/* Middle East - escalating */}
            <polyline points="45,75 90,72 135,65 178,50 220,35 265,20 280,15" fill="none" stroke="#ef4444" strokeWidth="1.5" />
            <circle cx="280" cy="15" r="2.5" fill="#ef4444">
              <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
            </circle>

            {/* Ukraine - stable */}
            <polyline points="45,45 90,43 135,46 178,44 220,45 265,42 280,43" fill="none" stroke="#f59e0b" strokeWidth="1" />

            {/* Taiwan - rising */}
            <polyline points="45,65 90,63 135,62 178,58 220,55 265,50 280,48" fill="none" stroke="#3b82f6" strokeWidth="1" />

            {/* Legend */}
            <line x1="35" y1="5" x2="45" y2="5" stroke="#ef4444" strokeWidth="1.5" />
            <text x="48" y="7" fontFamily="var(--font-ibm-plex-mono)" fontSize="5" fill="#ef4444">중동</text>
            <line x1="80" y1="5" x2="90" y2="5" stroke="#f59e0b" strokeWidth="1" />
            <text x="93" y="7" fontFamily="var(--font-ibm-plex-mono)" fontSize="5" fill="#f59e0b">우크라이나</text>
            <line x1="140" y1="5" x2="150" y2="5" stroke="#3b82f6" strokeWidth="1" />
            <text x="153" y="7" fontFamily="var(--font-ibm-plex-mono)" fontSize="5" fill="#3b82f6">대만 해협</text>
          </svg>
        </div>
      </div>

      {/* AI Briefing */}
      <div className="p-5" style={{ background: "var(--bg-primary)" }}>
        <h3 className="font-mono text-[0.65rem] tracking-[2px] uppercase mb-3.5 flex items-center gap-1.5" style={{ color: "var(--accent-purple)" }}>
          <span
            className="w-1.5 h-1.5"
            style={{
              background: "var(--accent-purple)",
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
            }}
          />
          AI 브리핑
        </h3>
        {BRIEFINGS.map((b, i) => (
          <div
            key={i}
            className="px-3 py-2.5 mb-1.5 border-l-2"
            style={{
              borderColor: "var(--accent-purple)",
              background: "rgba(168,85,247,0.04)",
            }}
          >
            <div className="font-mono text-[0.55rem] tracking-[1px] mb-1" style={{ color: "var(--accent-purple)" }}>
              {b.tag}
            </div>
            <p className="text-[0.78rem] leading-[1.6]" style={{ color: "var(--text-secondary)" }}>
              {b.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
