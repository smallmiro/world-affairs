"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  AIRPORT_STATUS,
  TIMELINE_EVENTS,
  AIRLINES,
  EK_ROUTES,
  AIRPORT_MAP_DATA,
} from "../../lib/airport-data";
import { useQuery } from "@tanstack/react-query";
import { useAirportStatus, useFlightPositions, useAirportEvents, useAirlineOps, useEmiratesRoutes, useDxbStats } from "../../hooks/use-airport";
import { useSSEPositions } from "../../hooks/use-sse-positions";
import type { SSEFlightPosition } from "../../hooks/use-sse-positions";
import { toStaticStatus, toMapData, toTimelineEvents, toAirlines, toRoutes } from "../../lib/airport-mappers";
import type { FlightPositionResponse } from "../../lib/api-client";
import { useLanguage } from "../../lib/language-context";
import { useT } from "../../hooks/use-t";
import AirportTimeline from "./AirportTimeline";
import AirlineGrid from "./AirlineGrid";
import EKRouteBadges from "./EKRouteBadges";
import FlightStatusPanel from "./FlightStatusPanel";
import SectionHeader from "../ui/SectionHeader";
import StatusLight from "../ui/StatusLight";

const AirportMapInner = dynamic(() => import("./AirportMapInner"), { ssr: false });

const STATUS_LIGHT_COLORS: Record<string, string> = {
  green: "var(--accent-green)",
  amber: "var(--accent-amber)",
  red: "var(--accent-red)",
};

function sseToFlightPositions(sseFlights: SSEFlightPosition[]): FlightPositionResponse[] {
  return sseFlights.map((f) => ({
    id: f.icao24,
    icao24: f.icao24,
    callsign: f.callsign,
    lat: f.lat,
    lon: f.lon,
    altitude: f.altitude,
    speed: f.speed,
    heading: f.heading,
    onGround: f.onGround,
    airlineIata: null,
    aircraftClass: f.aircraftClass as "ek" | "other",
    depAirport: null,
    arrAirport: null,
    depTime: null,
    arrTime: null,
    flightStatus: null,
    collectedAt: new Date().toISOString(),
  }));
}

interface AirportAssessment {
  status: string;
  light: "green" | "amber" | "red";
  riskScore: number;
  summary: { en: string; ko: string; ja: string };
  factors: { text: { en: string; ko: string }; impact: string }[];
  recommendation: { en: string; ko: string; ja: string };
}

async function fetchAssessment(): Promise<AirportAssessment | null> {
  const res = await fetch("/api/airport/assessment");
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export default function AirportMonitor() {
  const { data: statusData } = useAirportStatus();
  const { data: assessment } = useQuery({ queryKey: ["airport-assessment"], queryFn: fetchAssessment, staleTime: 30 * 60 * 1000, refetchInterval: 30 * 60 * 1000 });
  const { data: flightsData } = useFlightPositions();
  const { data: eventsData } = useAirportEvents();
  const { data: airlinesData } = useAirlineOps();
  const { data: routesData } = useEmiratesRoutes();
  const { data: dxbStats } = useDxbStats();
  const { flights: sseFlights, connected: sseConnected } = useSSEPositions();
  const { lang } = useLanguage();
  const t = useT();

  const effectiveFlights = useMemo(() => {
    if (sseFlights.length > 0) return sseToFlightPositions(sseFlights);
    return flightsData ?? [];
  }, [sseFlights, flightsData]);

  const status = useMemo(
    () => (statusData ? toStaticStatus(statusData) : AIRPORT_STATUS),
    [statusData],
  );
  const mapData = useMemo(
    () => (effectiveFlights.length > 0 ? toMapData(effectiveFlights) : AIRPORT_MAP_DATA),
    [effectiveFlights],
  );
  const timelineEvents = useMemo(
    () => (eventsData && eventsData.length > 0 ? toTimelineEvents(eventsData, lang) : TIMELINE_EVENTS),
    [eventsData, lang],
  );
  // Prefer DXB scraping data over AviationStack
  const airlines = useMemo(() => {
    if (dxbStats && dxbStats.airlines.length > 0) {
      return dxbStats.airlines.map((a) => ({ code: a.code, name: a.name, flights: a.flights, onTime: a.onTime, status: a.status }));
    }
    if (airlinesData && airlinesData.length > 0) return toAirlines(airlinesData);
    return AIRLINES;
  }, [dxbStats, airlinesData]);

  const routes = useMemo(() => {
    if (dxbStats && dxbStats.ekRoutes.length > 0) {
      return dxbStats.ekRoutes;
    }
    if (routesData && routesData.length > 0) return toRoutes(routesData);
    return EK_ROUTES;
  }, [dxbStats, routesData]);

  return (
    <div className="p-5 flex flex-col gap-3" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <SectionHeader
        title={t("airport.title")}
        accentColor="var(--accent-amber)"
        controls={
          <span className="flex items-center gap-2">
            {sseConnected && (
              <span
                className="font-mono text-[0.5rem] tracking-[1.5px] px-1.5 py-0.5 border"
                style={{ color: "var(--accent-green)", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.06)" }}
              >
                LIVE
              </span>
            )}
            <span className="font-mono text-[0.55rem] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
              {t("airport.cycle")}
            </span>
          </span>
        }
      />

      {/* AI Status Assessment */}
      {assessment ? (
        <div className="border" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-3 py-2" style={{ background: "var(--bg-secondary)" }}>
            <StatusLight color={assessment.light} size={8} pulse={true} />
            <span className="font-mono text-[0.65rem] font-semibold tracking-[1px]" style={{ color: STATUS_LIGHT_COLORS[assessment.light] }}>
              {assessment.status}
            </span>
            <span className="font-mono text-[0.55rem] px-1.5 py-px" style={{
              color: STATUS_LIGHT_COLORS[assessment.light],
              background: `${STATUS_LIGHT_COLORS[assessment.light]}15`,
            }}>
              RISK {assessment.riskScore}/100
            </span>
            <span className="font-mono text-[0.55rem] ml-auto" style={{ color: "var(--text-muted)" }}>
              AI ASSESSMENT
            </span>
          </div>
          <div className="px-3 py-2 text-[0.65rem] leading-[1.5] border-t" style={{ color: "var(--text-secondary)", borderColor: "var(--border)", background: "var(--bg-primary)" }}>
            {lang === "ja" ? assessment.summary.ja : lang === "en" ? assessment.summary.en : assessment.summary.ko}
          </div>
          <div className="px-3 py-1.5 flex flex-wrap gap-1 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
            {assessment.factors.map((f, i) => {
              const color = f.impact === "negative" ? "var(--accent-red)" : f.impact === "positive" ? "var(--accent-green)" : "var(--text-muted)";
              return (
                <span key={i} className="font-mono text-[0.48rem] px-1.5 py-px border" style={{ color, borderColor: `${color}30`, background: `${color}08` }}>
                  {f.impact === "negative" ? "▼" : f.impact === "positive" ? "▲" : "―"} {lang === "ko" ? f.text.ko : f.text.en}
                </span>
              );
            })}
          </div>
          <div className="px-3 py-1.5 font-mono text-[0.52rem] border-t" style={{ color: "var(--accent-amber)", borderColor: "var(--border)", background: "rgba(245,158,11,0.03)" }}>
            ⚠ {lang === "ja" ? assessment.recommendation.ja : lang === "en" ? assessment.recommendation.en : assessment.recommendation.ko}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-3 py-2 border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <StatusLight color={status.light} size={8} pulse={true} />
          <span className="font-mono text-[0.65rem] font-semibold tracking-[1px]" style={{ color: STATUS_LIGHT_COLORS[status.light] }}>
            {status.label}
          </span>
          <span className="font-mono text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
            {status.runways}
          </span>
        </div>
      )}

      {/* Map + Timeline side by side */}
      <div className="grid grid-cols-2 gap-px max-lg:grid-cols-1" style={{ background: "var(--border)" }}>
        {/* Map with radar */}
        <div className="relative" style={{ background: "var(--bg-primary)" }}>
          <div className="border overflow-hidden" style={{ borderColor: "var(--border)", height: 420 }}>
            <AirportMapInner mapData={mapData} />
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
            <span style={{ color: "var(--accent-cyan)" }}>✈ {mapData.aircraft.length}</span>
            <span className="mx-1" style={{ color: "var(--text-muted)" }}>TRACKED</span>
            <span style={{ color: "var(--accent-amber)" }}>EK {mapData.aircraft.filter((a) => a.cls === "ek").length}</span>
            <span className="ml-1" style={{ color: "var(--text-muted)" }}>
              OTHER {mapData.aircraft.filter((a) => a.cls !== "ek").length}
            </span>
          </div>
          {/* Legend */}
          <div
            className="absolute bottom-2 right-2 z-[600] px-2 py-1 font-mono text-[0.55rem] border"
            style={{ background: "rgba(10,14,23,0.85)", borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--accent-red)" }}>◉ {t("map.conflictZone")}</span>
            <span className="ml-1.5" style={{ color: "var(--accent-amber)" }}>◉ {t("map.cautionZone")}</span>
            <span className="ml-1.5" style={{ color: "var(--accent-green)" }}>◉ {t("map.safeZone")}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="pt-3 pr-2.5" style={{ background: "var(--bg-primary)" }}>
          <AirportTimeline events={timelineEvents} />
        </div>
      </div>

      {/* Bottom row: Airlines + Routes */}
      <div className="grid grid-cols-2 gap-3 max-lg:grid-cols-1">
        <AirlineGrid airlines={airlines} />
        <EKRouteBadges routes={routes} />
      </div>

      {/* Flight Status Table */}
      <FlightStatusPanel />
    </div>
  );
}
