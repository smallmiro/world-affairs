"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useGeoEvents } from "../../hooks/use-geo-events";
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
          <WorldMapInner events={filteredEvents} />
        )}
      </div>
    </section>
  );
}
