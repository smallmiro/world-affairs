"use client";

const ALERTS = [
  { level: "긴급", text: "호르무즈 해협 인근 이란 해군 훈련 감지 — 유조선 3척 우회 항로 진입" },
  { level: "속보", text: "예멘 후티 반군, 홍해 상선 공격 재개 선언 — 바브엘만데브 해협 위험도 상향" },
  { level: "주의", text: "남중국해 필리핀 EEZ 내 중국 해경선 4척 진입 확인" },
];

export default function AlertTicker() {
  const doubled = [...ALERTS, ...ALERTS];

  return (
    <div
      className="flex items-center gap-3 px-6 py-1.5 overflow-hidden border-b"
      style={{
        background: "var(--accent-red-dim)",
        borderColor: "rgba(239,68,68,0.2)",
      }}
    >
      <span
        className="font-mono text-[0.65rem] font-bold tracking-[2px] uppercase whitespace-nowrap"
        style={{
          color: "var(--accent-red)",
          animation: "blink-label 1s step-end infinite",
        }}
      >
        ALERT
      </span>
      <div className="flex-1 overflow-hidden">
        <div
          className="flex gap-20 whitespace-nowrap"
          style={{ animation: "scroll-ticker 30s linear infinite" }}
        >
          {doubled.map((alert, i) => (
            <span key={i} className="font-mono text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--accent-red)", fontWeight: 600 }}>[{alert.level}]</strong>{" "}
              {alert.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
