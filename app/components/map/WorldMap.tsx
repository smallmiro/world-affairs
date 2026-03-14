"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useGeoEvents } from "../../hooks/use-geo-events";
import { useFlightPositions } from "../../hooks/use-airport";
import SectionHeader from "../ui/SectionHeader";
import type { GeoEvent, GeoEventType } from "../../lib/types";

const WorldMapInner = dynamic(() => import("./WorldMapInner"), { ssr: false });

type MapFilter = "all" | "conflict";

interface FilterButton {
  label: string;
  filter: MapFilter | null;
  disabled: boolean;
}

const FILTER_BUTTONS: FilterButton[] = [
  { label: "긴장도", filter: "all", disabled: false },
  { label: "동맹", filter: null, disabled: true },
  { label: "무역", filter: null, disabled: true },
  { label: "분쟁", filter: "conflict", disabled: false },
];

const CONFLICT_EVENT_TYPES: GeoEventType[] = ["conflict", "military_exercise"];

function filterEvents(events: GeoEvent[], filter: MapFilter): GeoEvent[] {
  if (filter === "all") return events;
  return events.filter((e) =>
    CONFLICT_EVENT_TYPES.includes(e.eventType),
  );
}

export default function WorldMap() {
  const { data: events, isLoading } = useGeoEvents({ limit: 50 });
  const { data: flights } = useFlightPositions(100);
  const [activeFilter, setActiveFilter] = useState<MapFilter>("all");

  const filteredEvents = useMemo(
    () => filterEvents(events ?? [], activeFilter),
    [events, activeFilter],
  );

  return (
    <section
      className="p-5"
      style={{ animation: "fade-in-up 0.4s ease-out 0.05s both" }}
    >
      <div className="mb-4">
        <SectionHeader
          title="Global Tension Map"
          accentColor="var(--accent-cyan)"
          controls={
            <div className="flex gap-1">
              {FILTER_BUTTONS.map(({ label, filter, disabled }) => {
                const isActive = !disabled && filter === activeFilter;
                return (
                  <button
                    key={label}
                    onClick={disabled ? undefined : () => setActiveFilter(filter!)}
                    className={`font-mono text-[0.62rem] tracking-[0.5px] px-2 py-[3px] border transition-all duration-150 ${
                      disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                    style={{
                      color: isActive ? "var(--accent-cyan)" : "var(--text-muted)",
                      borderColor: isActive ? "var(--accent-cyan)" : "var(--border)",
                      background: isActive ? "var(--accent-cyan-dim)" : "transparent",
                    }}
                    aria-disabled={disabled}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          }
        />
      </div>

      <div
        className="relative w-full border overflow-hidden"
        style={{ borderColor: "var(--border)", height: 370 }}
      >
        {isLoading ? (
          <div
            className="flex items-center justify-center h-full"
            style={{ background: "#0a0e17" }}
          >
            <span className="font-mono text-[0.6rem] tracking-[2px]" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
              LOADING MAP...
            </span>
          </div>
        ) : (
          <WorldMapInner events={filteredEvents} flights={flights ?? []} />
        )}
        {/* Legend */}
        <div
          className="absolute bottom-2 right-2 z-[600] px-2 py-1.5 font-mono text-[0.5rem] border flex flex-col gap-1"
          style={{ background: "rgba(10,14,23,0.9)", borderColor: "var(--border)" }}
        >
          <div className="flex gap-2">
            <span style={{ color: "#ef4444" }}>◉ 분쟁구역</span>
            <span style={{ color: "#f59e0b" }}>◉ 경계구역</span>
            <span style={{ color: "#22c55e" }}>◉ 안전</span>
          </div>
          <div className="flex gap-2" style={{ borderTop: "1px solid var(--border)", paddingTop: 3 }}>
            <span style={{ color: "#ef4444" }}>✈ Emirates</span>
            <span style={{ color: "#f59e0b" }}>✈ Etihad</span>
            <span style={{ color: "#64748b" }}>✈ Other</span>
          </div>
        </div>
      </div>
    </section>
  );
}
