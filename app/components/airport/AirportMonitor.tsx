"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  AIRPORT_STATUS,
  TIMELINE_EVENTS,
  AIRLINES,
  EK_ROUTES,
  AIRPORT_MAP_DATA,
  type AirportStatus as StaticAirportStatus,
  type Airline,
  type EKRoute,
  type AirportMapData,
  type TimelineEvent,
} from "../../lib/airport-data";
import { useAirportStatus, useFlightPositions, useAirportEvents, useAirlineOps, useEmiratesRoutes } from "../../hooks/use-airport";
import type { AirportStatusResponse, FlightPositionResponse, AirportEventResponse, AirlineOpsResponse, EmiratesRouteResponse } from "../../lib/api-client";
import AirportTimeline from "./AirportTimeline";
import AirlineGrid from "./AirlineGrid";
import EKRouteBadges from "./EKRouteBadges";

const AirportMapInner = dynamic(() => import("./AirportMapInner"), { ssr: false });

const STATUS_LIGHT_COLORS: Record<string, string> = {
  green: "var(--accent-green)",
  amber: "var(--accent-amber)",
  red: "var(--accent-red)",
};

const STATUS_LABELS: Record<string, string> = {
  green: "OPERATIONAL",
  amber: "DELAYS",
  red: "DISRUPTED",
};

function toStaticStatus(data: AirportStatusResponse): StaticAirportStatus {
  return {
    light: data.light,
    label: STATUS_LABELS[data.light] ?? "UNKNOWN",
    runways: `${data.totalFlights} FLIGHTS · ${data.onTimePercent}% ON TIME`,
    weather: `${data.delayedFlights} DELAYED · ${data.cancelledFlights} CANCELLED`,
  };
}

function toMapData(flights: FlightPositionResponse[]): AirportMapData {
  return {
    aircraft: flights
      .filter((f) => !f.onGround)
      .map((f) => ({
        lat: f.lat,
        lng: f.lon,
        rotation: f.heading,
        flightLabel: f.callsign.trim() || f.icao24,
        altLabel: `FL${Math.round(f.altitude / 100)}`,
        cls: f.aircraftClass as "ek" | "other",
      })),
    flightPaths: [],
  };
}

function toTimelineEvents(events: AirportEventResponse[], lang: string): TimelineEvent[] {
  const grouped = new Map<string, AirportEventResponse[]>();
  for (const e of events) {
    const date = new Date(e.eventDate);
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    const arr = grouped.get(key) ?? [];
    arr.push(e);
    grouped.set(key, arr);
  }

  const today = new Date();
  const todayKey = `${today.getMonth() + 1}/${today.getDate()}`;
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return Array.from(grouped.entries()).map(([dateKey, evts]) => {
    const isToday = dateKey === todayKey;
    const firstDate = new Date(evts[0].eventDate);
    const dotType = evts[0].eventType as TimelineEvent["dotType"];
    return {
      date: dateKey,
      dayLabel: isToday ? "TODAY" : dayNames[firstDate.getDay()],
      isToday,
      dotType,
      entries: evts.map((e) => ({
        tags: [{ type: e.eventType as TimelineEvent["dotType"], label: e.eventType.toUpperCase() }],
        text: lang === "en" ? e.title.en : (e.title.ko || e.title.en),
      })),
    };
  });
}

function toAirlines(ops: AirlineOpsResponse[]): Airline[] {
  return ops.map((o) => ({
    code: o.airlineIata,
    name: o.airlineName,
    flights: o.totalFlights,
    onTime: o.onTimePercent,
    status: o.status,
  }));
}

function toRoutes(routes: EmiratesRouteResponse[]): EKRoute[] {
  return routes.map((r) => ({
    dest: r.destination,
    flightCode: r.flightCode,
    status: r.status,
  }));
}

export default function AirportMonitor() {
  const { data: statusData } = useAirportStatus();
  const { data: flightsData } = useFlightPositions();
  const { data: eventsData } = useAirportEvents();
  const { data: airlinesData } = useAirlineOps();
  const { data: routesData } = useEmiratesRoutes();

  const status = useMemo(
    () => (statusData ? toStaticStatus(statusData) : AIRPORT_STATUS),
    [statusData],
  );
  const mapData = useMemo(
    () => (flightsData && flightsData.length > 0 ? toMapData(flightsData) : AIRPORT_MAP_DATA),
    [flightsData],
  );
  const timelineEvents = useMemo(
    () => (eventsData && eventsData.length > 0 ? toTimelineEvents(eventsData, "ko") : TIMELINE_EVENTS),
    [eventsData],
  );
  const airlines = useMemo(
    () => (airlinesData && airlinesData.length > 0 ? toAirlines(airlinesData) : AIRLINES),
    [airlinesData],
  );
  const routes = useMemo(
    () => (routesData && routesData.length > 0 ? toRoutes(routesData) : EK_ROUTES),
    [routesData],
  );

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
            background: STATUS_LIGHT_COLORS[status.light],
            boxShadow: `0 0 8px ${STATUS_LIGHT_COLORS[status.light]}`,
            animation: "pulse-dot 2s ease-in-out infinite",
          }}
        />
        <span className="font-mono text-[0.65rem] font-semibold tracking-[1px]" style={{ color: STATUS_LIGHT_COLORS[status.light] }}>
          {status.label}
        </span>
        <span className="font-mono text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
          {status.runways}
        </span>
        <span className="font-mono text-[0.6rem] ml-auto" style={{ color: "var(--text-muted)" }}>
          {status.weather}
        </span>
      </div>

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
            <span style={{ color: "var(--accent-red)" }}>◉ 분쟁구역</span>
            <span className="ml-1.5" style={{ color: "var(--accent-amber)" }}>◉ 경계구역</span>
            <span className="ml-1.5" style={{ color: "var(--accent-green)" }}>◉ 안전</span>
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
    </div>
  );
}
