"use client";

const HOTSPOTS = [
  { lat: 27, lon: 56, label: "호르무즈 해협", severity: "critical", desc: "이란 해군 훈련 감지" },
  { lat: 13, lon: 43.5, label: "바브엘만데브", severity: "critical", desc: "후티 공격 재개 선언" },
  { lat: 48.5, lon: 35, label: "우크라이나", severity: "warning", desc: "러-우 전쟁 지속" },
  { lat: 24, lon: 121, label: "대만 해협", severity: "warning", desc: "미-중 긴장 고조" },
  { lat: 14, lon: 115, label: "남중국해", severity: "info", desc: "필리핀 EEZ 해경 진입" },
  { lat: 33, lon: 44, label: "이라크", severity: "warning", desc: "민병대 활동 증가" },
];

function HotspotDot({ severity }: { severity: string }) {
  const color =
    severity === "critical"
      ? "var(--accent-red)"
      : severity === "warning"
        ? "var(--accent-amber)"
        : "var(--accent-blue)";

  return (
    <span className="relative inline-block w-3 h-3">
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: color, animation: "hpulse 2s ease-out infinite" }}
      />
      <span className="absolute inset-[3px] rounded-full z-10" style={{ background: color }} />
    </span>
  );
}

export default function WorldMap() {
  return (
    <section
      className="p-5"
      style={{ animation: "fade-in-up 0.4s ease-out 0.05s both" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2"
            style={{
              background: "var(--accent-cyan)",
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
            }}
          />
          <h2 className="font-mono text-[0.72rem] font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>
            Global Tension Map
          </h2>
        </div>
        <div className="flex gap-1">
          {["긴장도", "동맹", "무역", "분쟁"].map((label, i) => (
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

      {/* Map placeholder with stylized grid */}
      <div
        className="relative w-full border overflow-hidden"
        style={{
          height: 370,
          borderColor: "var(--border)",
          background: "linear-gradient(180deg, #0a0e17 0%, #0d1220 50%, #0a0e17 100%)",
        }}
      >
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {Array.from({ length: 7 }, (_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={`${(i + 1) * 12.5}%`}
              x2="100%"
              y2={`${(i + 1) * 12.5}%`}
              stroke="#1e293b"
              strokeWidth="0.3"
              strokeDasharray="4 8"
            />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={`${(i + 1) * 8.3}%`}
              y1="0"
              x2={`${(i + 1) * 8.3}%`}
              y2="100%"
              stroke="#1e293b"
              strokeWidth="0.3"
              strokeDasharray="4 8"
            />
          ))}
        </svg>

        {/* Simplified world continents overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[0.6rem] tracking-[3px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>
            LEAFLET MAP INTEGRATION PENDING
          </span>
        </div>

        {/* Hotspot markers */}
        {HOTSPOTS.map((spot) => {
          const x = ((spot.lon + 180) / 360) * 100;
          const y = ((90 - spot.lat) / 180) * 100;
          return (
            <div
              key={spot.label}
              className="absolute group/spot cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
            >
              <HotspotDot severity={spot.severity} />
              <div
                className="absolute left-5 top-1/2 -translate-y-1/2 hidden group-hover/spot:block z-20 min-w-[160px] p-2.5 border"
                style={{
                  background: "rgba(15,20,32,0.95)",
                  borderColor: "var(--border-active)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  className="font-mono text-[0.75rem] font-bold tracking-[1px] mb-1"
                  style={{
                    color: spot.severity === "critical" ? "var(--accent-red)" : "var(--accent-amber)",
                  }}
                >
                  {spot.label}
                </div>
                <div className="text-[0.72rem] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {spot.desc}
                </div>
              </div>
            </div>
          );
        })}

        {/* Region heat indicators */}
        <div
          className="absolute rounded-full"
          style={{
            left: "60%", top: "30%", width: 80, height: 80,
            background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "55%", top: "45%", width: 60, height: 60,
            background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "72%", top: "35%", width: 50, height: 50,
            background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
          }}
        />
      </div>
    </section>
  );
}
