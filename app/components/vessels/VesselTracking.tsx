"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useVessels } from "../../hooks/use-vessels";
import { useGeoEvents } from "../../hooks/use-geo-events";
import { useSSEPositions } from "../../hooks/use-sse-positions";
import { useLanguage } from "../../lib/language-context";
import { useT } from "../../hooks/use-t";
import { getTranslatedText, formatTime } from "../../lib/display-mappers";
import SectionHeader from "../ui/SectionHeader";
import MaritimeEventModal from "./MaritimeEventModal";
import type { VesselWithPosition, GeoEvent } from "../../lib/types";
import type { GeoEvent as DomainGeoEvent } from "../../../src/domain/geopolitics/entities";

const VesselMapInner = dynamic(() => import("./VesselMapInner"), { ssr: false });

type VesselFilter = "all" | "tanker" | "lpg_lng" | "cargo" | "passenger";

const FILTER_BUTTONS: { key: VesselFilter; i18nKey: string }[] = [
  { key: "all", i18nKey: "common.all" },
  { key: "tanker", i18nKey: "vessels.tanker" },
  { key: "lpg_lng", i18nKey: "vessels.lpgLng" },
  { key: "cargo", i18nKey: "vessels.cargo" },
  { key: "passenger", i18nKey: "vessels.passenger" },
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

const MARITIME_KEYWORDS = [
  "hormuz", "houthi", "ship", "tanker", "naval", "maritime", "red sea",
  "blockade", "piracy", "vessel", "strait", "navy", "marine", "gulf",
  "shipping", "cargo ship", "oil tanker", "suez",
];

const MARITIME_TAG_MAP: [string, string[]][] = [
  ["ATTACK", ["attack", "strike", "missile", "houthi", "drone"]],
  ["BLOCKADE", ["blockade", "closure", "restrict", "ban"]],
  ["MILITARY", ["navy", "naval", "marine", "military", "deploy"]],
  ["PIRACY", ["piracy", "pirate", "hijack", "seize"]],
  ["ALERT", ["alert", "warning", "risk", "disruption", "crisis"]],
];

function classifyMaritimeTag(title: string): { tag: string; color: string } {
  const lower = title.toLowerCase();
  for (const [tag, keywords] of MARITIME_TAG_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      if (tag === "ATTACK") return { tag, color: "var(--accent-red)" };
      if (tag === "BLOCKADE") return { tag, color: "var(--accent-red)" };
      if (tag === "MILITARY") return { tag, color: "var(--accent-amber)" };
      if (tag === "PIRACY") return { tag, color: "var(--accent-red)" };
      return { tag, color: "var(--accent-amber)" };
    }
  }
  return { tag: "INFO", color: "var(--accent-cyan)" };
}

function filterMaritimeEvents(events: GeoEvent[]): GeoEvent[] {
  return events.filter((e) => {
    const title = (e.title?.en ?? "").toLowerCase();
    return MARITIME_KEYWORDS.some((kw) => title.includes(kw));
  });
}

function getAnomalies(vessels: VesselWithPosition[]): VesselWithPosition[] {
  return vessels.filter(
    (v) => v.latestPosition && (v.latestPosition.status !== "normal" || v.latestPosition.speed === 0),
  );
}

function mergeSSEPositions(
  restVessels: VesselWithPosition[],
  sseVessels: { mmsi: string; lat: number; lon: number; speed: number | null; course: number | null; timestamp: string }[],
): VesselWithPosition[] {
  if (sseVessels.length === 0) return restVessels;

  const sseMap = new Map(sseVessels.map((v) => [v.mmsi, v]));
  return restVessels.map((vessel) => {
    const sse = sseMap.get(vessel.mmsi);
    if (!sse || !vessel.latestPosition) return vessel;
    return {
      ...vessel,
      latestPosition: {
        ...vessel.latestPosition,
        lat: sse.lat,
        lon: sse.lon,
        speed: sse.speed ?? vessel.latestPosition.speed,
        course: sse.course ?? vessel.latestPosition.course,
        collectedAt: new Date(sse.timestamp),
      },
    };
  });
}

export default function VesselTracking() {
  const [activeFilter, setActiveFilter] = useState<VesselFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<GeoEvent | null>(null);
  const { data: vessels, isLoading } = useVessels({ refetchInterval: 300_000 });
  const { vessels: sseVessels, connected: sseConnected } = useSSEPositions();
  const { data: geoEvents } = useGeoEvents({ limit: 100 });
  const { lang } = useLanguage();
  const t = useT();

  const maritimeNews = useMemo(
    () => filterMaritimeEvents(geoEvents ?? []).slice(0, 5),
    [geoEvents],
  );

  const mergedVessels = useMemo(
    () => mergeSSEPositions(vessels ?? [], sseVessels),
    [vessels, sseVessels],
  );

  const filteredVessels = useMemo(() => {
    if (activeFilter === "tanker") {
      return mergedVessels.filter((v) => v.type === "tanker_crude" || v.type === "tanker_product");
    }
    if (activeFilter === "lpg_lng") {
      return mergedVessels.filter((v) => v.type === "lpg" || v.type === "lng");
    }
    if (activeFilter === "cargo") {
      return mergedVessels.filter((v) => v.type === "cargo" || v.type === "container" || v.type === "bulk");
    }
    if (activeFilter === "passenger") {
      return mergedVessels.filter((v) => v.type === "passenger");
    }
    return mergedVessels;
  }, [mergedVessels, activeFilter]);

  const allVessels = filteredVessels;
  const zoneStats = countByZone(allVessels);
  const anomalies = getAnomalies(allVessels);

  return (
    <div className="p-4 flex flex-col gap-3 flex-1">
      {/* Header */}
      <SectionHeader
        title={t("vessels.title")}
        accentColor="var(--accent-cyan)"
        controls={
          sseConnected ? (
            <span
              className="font-mono text-[0.72rem] tracking-[1.5px] px-1.5 py-0.5 border"
              style={{ color: "var(--accent-green)", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.06)" }}
            >
              LIVE
            </span>
          ) : undefined
        }
      />

      {/* Type filter */}
      <div className="flex flex-wrap gap-1 sm:gap-1">
        {FILTER_BUTTONS.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setActiveFilter(btn.key)}
            className="font-mono text-[0.65rem] tracking-[1px] px-2 py-2 sm:px-3 sm:py-2.5 border rounded cursor-pointer transition-all duration-200"
            style={{
              color: activeFilter === btn.key ? "var(--accent-cyan)" : "var(--text-muted)",
              borderColor: activeFilter === btn.key ? "var(--accent-cyan)" : "var(--border)",
              background: activeFilter === btn.key ? "rgba(0,255,255,0.05)" : "transparent",
            }}
          >
            {t(btn.i18nKey)}
          </button>
        ))}
      </div>

      {/* Map */}
      <div
        className="relative w-full border overflow-hidden h-[250px] md:h-[300px] lg:h-[340px]"
        style={{ borderColor: "var(--border)" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full" style={{ background: "var(--map-bg, #1a1b26)" }}>
            <span className="font-mono text-[0.8rem] tracking-[2px]" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
              {t("common.loadingMap")}
            </span>
          </div>
        ) : (
          <VesselMapInner vessels={allVessels} />
        )}
      </div>

      {/* Passage Stats (left) + Anomaly Alerts (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Passage stats */}
        <div>
          <h3 className="font-mono text-[0.75rem] tracking-[1.5px] uppercase mb-1" style={{ color: "var(--text-muted)" }}>
            {t("vessels.passageStats")}
          </h3>
          <div className="flex flex-col gap-1">
            {isLoading ? (
              <span className="font-mono text-[0.68rem]" style={{ color: "var(--text-muted)" }}>{t("common.loading")}</span>
            ) : zoneStats.length === 0 ? (
              <span className="font-mono text-[0.68rem]" style={{ color: "var(--text-muted)" }}>{t("common.noData")}</span>
            ) : (
              zoneStats.slice(0, 3).map((z) => (
                <div
                  key={z.zone}
                  className="flex items-center justify-between px-2 py-1.5 border"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                >
                  <div>
                    <div className="font-mono text-[0.8rem] tracking-[0.5px]" style={{ color: "var(--text-secondary)" }}>
                      {z.ko}
                    </div>
                    <div className="font-mono text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                      {z.en}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.8rem] font-bold" style={{ color: "var(--text-primary)" }}>
                      {z.count}
                    </span>
                    <span className="font-mono text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                      {t("vessels.ships")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Maritime situation alerts */}
        <div>
          <h3 className="font-mono text-[0.75rem] tracking-[1.5px] uppercase mb-1" style={{ color: "var(--accent-amber)" }}>
            {t("vessels.maritimeAlerts")}
          </h3>
          <div className="flex flex-col gap-1 flex-1" style={{ maxHeight: 400, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "var(--border-active) transparent" }}>
            {/* Vessel anomalies */}
            {anomalies.slice(0, 2).map((v) => {
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
                  <span className="font-mono text-[0.75rem] font-bold shrink-0 mt-px" style={{ color: isCritical ? "var(--accent-red)" : "var(--accent-amber)" }}>
                    {isCritical ? "!!" : "!"}
                  </span>
                  <div>
                    <div className="text-[0.8rem] font-medium mb-0.5" style={{ color: isCritical ? "var(--accent-red)" : "var(--accent-amber)" }}>
                      {v.name} — {v.latestPosition?.status.toUpperCase()}
                    </div>
                    <div className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                      {v.type} · {v.latestPosition?.speed ?? 0} kn · {v.latestPosition?.zone ?? "—"}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Maritime news */}
            {maritimeNews.map((event) => {
              const { tag, color } = classifyMaritimeTag(event.title?.en ?? "");
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-2 px-2 py-1.5 border text-[0.68rem] cursor-pointer transition-colors duration-150 hover:border-[var(--accent-cyan)]"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <span
                    className="font-mono text-[0.7rem] font-bold tracking-[0.5px] shrink-0 mt-0.5 px-1 py-px"
                    style={{ color, background: `${color}15` }}
                  >
                    {tag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.8rem] leading-[1.4] line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {getTranslatedText(event.title, lang)}
                    </div>
                    <div className="text-[0.72rem] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {formatTime(event.eventDate)} · {event.countries.join(", ")}
                    </div>
                  </div>
                </div>
              );
            })}

            {anomalies.length === 0 && maritimeNews.length === 0 && (
              <span className="font-mono text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
                {t("vessels.noAnomalies")}
              </span>
            )}
          </div>
        </div>
      </div>
      {selectedEvent && (
        <MaritimeEventModal
          event={selectedEvent as unknown as DomainGeoEvent}
          lang={lang}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
