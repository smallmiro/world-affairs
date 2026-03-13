"use client";

import dynamic from "next/dynamic";
import {
  AIRPORT_STATUS,
  TIMELINE_EVENTS,
  AIRLINES,
  EK_ROUTES,
  AIRPORT_MAP_DATA,
} from "../../lib/airport-data";
import AirportTimeline from "./AirportTimeline";
import AirlineGrid from "./AirlineGrid";
import EKRouteBadges from "./EKRouteBadges";

const AirportMapInner = dynamic(() => import("./AirportMapInner"), { ssr: false });

const STATUS_LIGHT_COLORS: Record<string, string> = {
  green: "var(--accent-green)",
  amber: "var(--accent-amber)",
  red: "var(--accent-red)",
};

export default function AirportMonitor() {
  return (
    <div className="p-5 flex flex-col gap-3" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2"
            style={{ background: "var(--accent-amber)", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }}
          />
          <h2 className="font-mono text-[0.72rem] font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>
            DUBAI INTL (DXB) — 항공 모니터
          </h2>
        </div>
        <span className="font-mono text-[0.55rem] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
          1H CYCLE · LAST 7D
        </span>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center gap-3 px-3 py-2 border"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: STATUS_LIGHT_COLORS[AIRPORT_STATUS.light],
            boxShadow: `0 0 8px ${STATUS_LIGHT_COLORS[AIRPORT_STATUS.light]}`,
            animation: "pulse-dot 2s ease-in-out infinite",
          }}
        />
        <span className="font-mono text-[0.65rem] font-semibold tracking-[1px]" style={{ color: STATUS_LIGHT_COLORS[AIRPORT_STATUS.light] }}>
          {AIRPORT_STATUS.label}
        </span>
        <span className="font-mono text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
          {AIRPORT_STATUS.runways}
        </span>
        <span className="font-mono text-[0.6rem] ml-auto" style={{ color: "var(--text-muted)" }}>
          {AIRPORT_STATUS.weather}
        </span>
      </div>

      {/* Map + Timeline side by side */}
      <div className="grid grid-cols-2 gap-px max-lg:grid-cols-1" style={{ background: "var(--border)" }}>
        {/* Map with radar */}
        <div className="relative" style={{ background: "var(--bg-primary)" }}>
          <div className="border overflow-hidden" style={{ borderColor: "var(--border)", height: 420 }}>
            <AirportMapInner mapData={AIRPORT_MAP_DATA} />
          </div>
          {/* Radar sweep overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 500,
              background: "conic-gradient(from 0deg at 60% 45%, rgba(6,182,212,0.08) 0deg, transparent 60deg, transparent 360deg)",
              animation: "radar-rotate 4s linear infinite",
            }}
          />
          {/* Flight counter */}
          <div
            className="absolute top-2 left-2 z-[600] px-2 py-1 font-mono text-[0.6rem] border"
            style={{ background: "rgba(10,14,23,0.85)", borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--accent-cyan)" }}>✈ {AIRPORT_MAP_DATA.aircraft.length}</span>
            <span className="mx-1" style={{ color: "var(--text-muted)" }}>TRACKED</span>
            <span style={{ color: "var(--accent-amber)" }}>EK {AIRPORT_MAP_DATA.aircraft.filter((a) => a.cls === "ek").length}</span>
            <span className="ml-1" style={{ color: "var(--text-muted)" }}>
              OTHER {AIRPORT_MAP_DATA.aircraft.filter((a) => a.cls !== "ek").length}
            </span>
          </div>
          {/* Legend */}
          <div
            className="absolute bottom-2 right-2 z-[600] px-2 py-1 font-mono text-[0.55rem] border"
            style={{ background: "rgba(10,14,23,0.85)", borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--accent-red)" }}>◉ 분쟁구역</span>
            <span className="ml-1.5" style={{ color: "var(--accent-amber)" }}>◉ 경계구역</span>
            <span className="ml-1.5" style={{ color: "var(--accent-green)" }}>◉ 안전</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="pt-3 pr-2.5" style={{ background: "var(--bg-primary)" }}>
          <AirportTimeline events={TIMELINE_EVENTS} />
        </div>
      </div>

      {/* Bottom row: Airlines + Routes */}
      <div className="grid grid-cols-2 gap-3 max-lg:grid-cols-1">
        <AirlineGrid airlines={AIRLINES} />
        <EKRouteBadges routes={EK_ROUTES} />
      </div>
    </div>
  );
}
