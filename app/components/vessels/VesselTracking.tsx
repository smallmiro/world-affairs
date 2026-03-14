"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useVessels } from "../../hooks/use-vessels";
import SectionHeader from "../ui/SectionHeader";
import type { VesselWithPosition } from "../../lib/types";

const VesselMapInner = dynamic(() => import("./VesselMapInner"), { ssr: false });

type VesselFilter = "all" | "tanker" | "lpg_lng";

const FILTER_BUTTONS: { key: VesselFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "tanker", label: "유조선" },
  { key: "lpg_lng", label: "LPG|LNG" },
];

const ZONE_LABELS: Record<string, { ko: string; en: string }> = {
  hormuz: { ko: "호르무즈 해협", en: "Strait of Hormuz" },
  bab_el_mandeb: { ko: "바브엘만데브", en: "Bab el-Mandeb" },
  suez: { ko: "수에즈 운하", en: "Suez Canal" },
  persian_gulf: { ko: "페르시아만", en: "Persian Gulf" },
  red_sea: { ko: "홍해", en: "Red Sea" },
  gulf_of_aden: { ko: "아덴만", en: "Gulf of Aden" },
};

function countByZone(vessels: VesselWithPosition[]): { zone: string; ko: string; en: string; count: number }[] {
  const zoneCount = new Map<string, number>();
  for (const v of vessels) {
    const zone = v.latestPosition?.zone;
    if (zone) {
      zoneCount.set(zone, (zoneCount.get(zone) ?? 0) + 1);
    }
  }
  return [...zoneCount.entries()]
    .map(([zone, count]) => ({
      zone,
      ko: ZONE_LABELS[zone]?.ko ?? zone,
      en: ZONE_LABELS[zone]?.en ?? zone,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function getAnomalies(vessels: VesselWithPosition[]): VesselWithPosition[] {
  return vessels.filter(
    (v) => v.latestPosition && (v.latestPosition.status !== "normal" || v.latestPosition.speed === 0),
  );
}

export default function VesselTracking() {
  const [activeFilter, setActiveFilter] = useState<VesselFilter>("all");
  const { data: vessels, isLoading } = useVessels();

  const filteredVessels = useMemo(() => {
    const all = vessels ?? [];
    if (activeFilter === "tanker") {
      return all.filter((v) => v.type === "tanker_crude" || v.type === "tanker_product");
    }
    if (activeFilter === "lpg_lng") {
      return all.filter((v) => v.type === "lpg" || v.type === "lng");
    }
    return all;
  }, [vessels, activeFilter]);

  const allVessels = filteredVessels;
  const zoneStats = countByZone(allVessels);
  const anomalies = getAnomalies(allVessels);

  return (
    <div className="p-5 flex flex-col gap-3" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <SectionHeader title="중동 해역 선박 추적" accentColor="var(--accent-cyan)" />

      {/* Type filter */}
      <div className="flex gap-1">
        {FILTER_BUTTONS.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setActiveFilter(btn.key)}
            className="font-mono text-[0.65rem] tracking-[1px] px-3 py-1 border cursor-pointer transition-all duration-200"
            style={{
              color: activeFilter === btn.key ? "var(--accent-cyan)" : "var(--text-muted)",
              borderColor: activeFilter === btn.key ? "var(--accent-cyan)" : "var(--border)",
              background: activeFilter === btn.key ? "rgba(0,255,255,0.05)" : "transparent",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div
        className="relative w-full border overflow-hidden"
        style={{ borderColor: "var(--border)", height: 340 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full" style={{ background: "#0a0e17" }}>
            <span className="font-mono text-[0.6rem] tracking-[2px]" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
              LOADING MAP...
            </span>
          </div>
        ) : (
          <VesselMapInner vessels={allVessels} />
        )}
      </div>

      {/* Passage Stats (left) + Anomaly Alerts (right) */}
      <div className="grid grid-cols-2 gap-2 max-lg:grid-cols-1">
        {/* Passage stats */}
        <div>
          <h3 className="font-mono text-[0.55rem] tracking-[1.5px] uppercase mb-1" style={{ color: "var(--text-muted)" }}>
            해협별 통과 현황 (24H)
          </h3>
          <div className="flex flex-col gap-1">
            {isLoading ? (
              <span className="font-mono text-[0.68rem]" style={{ color: "var(--text-muted)" }}>LOADING...</span>
            ) : zoneStats.length === 0 ? (
              <span className="font-mono text-[0.68rem]" style={{ color: "var(--text-muted)" }}>NO DATA</span>
            ) : (
              zoneStats.slice(0, 3).map((z) => (
                <div
                  key={z.zone}
                  className="flex items-center justify-between px-2 py-1.5 border"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                >
                  <div>
                    <div className="font-mono text-[0.58rem] tracking-[0.5px]" style={{ color: "var(--text-secondary)" }}>
                      {z.ko}
                    </div>
                    <div className="font-mono text-[0.46rem]" style={{ color: "var(--text-muted)" }}>
                      {z.en}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.8rem] font-bold" style={{ color: "var(--text-primary)" }}>
                      {z.count}
                    </span>
                    <span className="font-mono text-[0.46rem]" style={{ color: "var(--text-muted)" }}>
                      척
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Anomaly alerts */}
        <div>
          <h3 className="font-mono text-[0.55rem] tracking-[1.5px] uppercase mb-1" style={{ color: "var(--accent-amber)" }}>
            이상 감지 알림
          </h3>
          <div className="flex flex-col gap-1">
            {anomalies.length === 0 ? (
              <span className="font-mono text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
                이상 감지 없음
              </span>
            ) : (
              anomalies.slice(0, 3).map((v) => {
                const isCritical = v.latestPosition?.status === "anomaly";
                return (
                  <div
                    key={v.id}
                    className="flex items-start gap-2 px-2 py-1.5 border text-[0.68rem]"
                    style={{
                      background: isCritical ? "var(--accent-red-dim)" : "var(--accent-amber-dim)",
                      borderColor: isCritical ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span
                      className="font-mono text-[0.55rem] font-bold shrink-0 mt-px"
                      style={{ color: isCritical ? "var(--accent-red)" : "var(--accent-amber)" }}
                    >
                      {isCritical ? "!!" : "!"}
                    </span>
                    <div>
                      <div
                        className="text-[0.6rem] font-medium mb-0.5"
                        style={{ color: isCritical ? "var(--accent-red)" : "var(--accent-amber)" }}
                      >
                        {v.name} — {v.latestPosition?.status.toUpperCase()}
                      </div>
                      <div className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                        {v.type} · {v.latestPosition?.speed ?? 0} kn · {v.latestPosition?.zone ?? "—"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
