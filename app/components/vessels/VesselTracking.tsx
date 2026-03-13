"use client";

interface PassageStat {
  nameKo: string;
  nameEn: string;
  count: number;
  trend: string;
  trendDir: "up" | "down";
}

interface Anomaly {
  level: "critical" | "warning";
  title: string;
  detail: string;
}

const PASSAGES: PassageStat[] = [
  { nameKo: "호르무즈 해협", nameEn: "Strait of Hormuz", count: 23, trend: "-12%", trendDir: "down" },
  { nameKo: "바브엘만데브", nameEn: "Bab el-Mandeb", count: 8, trend: "-34%", trendDir: "down" },
  { nameKo: "수에즈 운하", nameEn: "Suez Canal", count: 11, trend: "-28%", trendDir: "down" },
];

const ANOMALIES: Anomaly[] = [
  { level: "critical", title: "유조선 3척 희망봉 우회 항로 진입", detail: "VLCC Atlantic Pioneer 외 2척 · 홍해 회피" },
  { level: "warning", title: "아덴만 비정상 정박 감지", detail: "LPG선 Gulf Energy · 48시간 이상 정박" },
  { level: "warning", title: "호르무즈 해협 통과량 급감", detail: "전일 대비 -12% · 이란 해군 훈련 영향 추정" },
];

const VESSELS = [
  { name: "VLCC Scepter", type: "tanker", lat: 26.2, lon: 56.4, speed: 12.5 },
  { name: "LPG Carrier Dawn", type: "lpg", lat: 25.8, lon: 55.8, speed: 10.2 },
  { name: "Atlantic Pioneer", type: "reroute", lat: 14.5, lon: 52.0, speed: 14.8 },
  { name: "Gulf Energy", type: "lpg", lat: 12.8, lon: 45.2, speed: 0.0 },
  { name: "Pacific Venture", type: "tanker", lat: 29.8, lon: 32.5, speed: 8.4 },
  { name: "Hormuz Express", type: "tanker", lat: 26.5, lon: 56.8, speed: 11.0 },
];

export default function VesselTracking() {
  return (
    <section
      className="grid grid-cols-[1fr_340px] gap-px max-lg:grid-cols-1"
      style={{
        background: "var(--border)",
        animation: "fade-in-up 0.4s ease-out 0.2s both",
      }}
    >
      {/* Map panel */}
      <div className="p-5" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2"
              style={{ background: "var(--accent-cyan)", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }}
            />
            <h2 className="font-mono text-[0.72rem] font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>
              중동 해역 선박 추적
            </h2>
          </div>
          <div className="flex gap-1">
            {["전체", "유조선", "LPG/LNG"].map((label, i) => (
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

        {/* Vessel map placeholder */}
        <div
          className="relative w-full border overflow-hidden"
          style={{
            height: 340,
            borderColor: "var(--border)",
            background: "linear-gradient(135deg, #0a0e17 0%, #0d1525 50%, #0a0e17 100%)",
          }}
        >
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={`${(i + 1) * 14.2}%`} x2="100%" y2={`${(i + 1) * 14.2}%`} stroke="#1e293b" strokeWidth="0.3" strokeDasharray="4 8" />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <line key={`v${i}`} x1={`${(i + 1) * 11.1}%`} y1="0" x2={`${(i + 1) * 11.1}%`} y2="100%" stroke="#1e293b" strokeWidth="0.3" strokeDasharray="4 8" />
            ))}
          </svg>

          {/* Region labels */}
          <span className="absolute font-mono text-[0.5rem] tracking-[2px] uppercase" style={{ color: "var(--text-muted)", opacity: 0.3, top: "10%", left: "15%" }}>
            PERSIAN GULF
          </span>
          <span className="absolute font-mono text-[0.5rem] tracking-[2px] uppercase" style={{ color: "var(--text-muted)", opacity: 0.3, top: "60%", left: "5%" }}>
            RED SEA
          </span>
          <span className="absolute font-mono text-[0.5rem] tracking-[2px] uppercase" style={{ color: "var(--text-muted)", opacity: 0.3, top: "25%", right: "10%" }}>
            STRAIT OF HORMUZ
          </span>

          {/* Vessel markers */}
          {VESSELS.map((v) => {
            const x = ((v.lon - 30) / 30) * 100;
            const y = ((32 - v.lat) / 22) * 100;
            const color =
              v.type === "reroute" ? "var(--accent-red)"
              : v.type === "lpg" ? "var(--accent-cyan)"
              : "var(--accent-amber)";

            return (
              <div
                key={v.name}
                className="absolute group/v cursor-pointer"
                style={{ left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(5, Math.min(95, y))}%`, transform: "translate(-50%,-50%)" }}
              >
                {/* Triangle marker */}
                <div
                  style={{
                    width: 0, height: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderBottom: `10px solid ${color}`,
                    filter: `drop-shadow(0 0 4px ${color})`,
                  }}
                />
                {/* Tooltip */}
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 hidden group-hover/v:block z-20 min-w-[140px] p-2 border"
                  style={{ background: "rgba(15,20,32,0.95)", borderColor: "var(--border-active)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
                >
                  <div className="font-mono text-[0.65rem] font-bold tracking-[0.5px] mb-0.5" style={{ color }}>
                    {v.name}
                  </div>
                  <div className="font-mono text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
                    {v.type === "tanker" ? "유조선" : v.type === "lpg" ? "LPG선" : "우회 항로"} · {v.speed} kn
                  </div>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-2 right-2 font-mono text-[0.5rem] tracking-[2px]" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
            LEAFLET MAP PENDING
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="p-5 flex flex-col gap-4" style={{ background: "var(--bg-primary)" }}>
        {/* Passage stats */}
        <div>
          <h3 className="font-mono text-[0.65rem] tracking-[1.5px] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
            해협별 통과 현황 (24H)
          </h3>
          <div className="flex flex-col gap-2">
            {PASSAGES.map((p) => (
              <div
                key={p.nameKo}
                className="flex items-center justify-between px-3 py-2.5 border"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
              >
                <div>
                  <div className="font-mono text-[0.68rem] tracking-[0.5px]" style={{ color: "var(--text-secondary)" }}>
                    {p.nameKo}
                  </div>
                  <div className="font-mono text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                    {p.nameEn}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.6rem] font-semibold" style={{ color: "var(--accent-green)" }}>
                    {"\u25BC"} {p.trend}
                  </span>
                  <span className="font-mono text-[1.1rem] font-bold" style={{ color: "var(--text-primary)" }}>
                    {p.count}
                  </span>
                  <span className="font-mono text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                    척
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly alerts */}
        <div>
          <h3 className="font-mono text-[0.65rem] tracking-[1.5px] uppercase mb-2" style={{ color: "var(--accent-amber)" }}>
            이상 감지 알림
          </h3>
          <div className="flex flex-col gap-1">
            {ANOMALIES.map((a, i) => {
              const isCritical = a.level === "critical";
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 px-2.5 py-2 border text-[0.72rem]"
                  style={{
                    background: isCritical ? "var(--accent-red-dim)" : "var(--accent-amber-dim)",
                    borderColor: isCritical ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span
                    className="font-mono text-[0.6rem] font-bold shrink-0 mt-px"
                    style={{ color: isCritical ? "var(--accent-red)" : "var(--accent-amber)" }}
                  >
                    {isCritical ? "!!" : "!"}
                  </span>
                  <div>
                    <div
                      className="text-[0.68rem] font-medium mb-0.5"
                      style={{ color: isCritical ? "var(--accent-red)" : "var(--accent-amber)" }}
                    >
                      {a.title}
                    </div>
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {a.detail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
