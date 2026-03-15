import type {
  AirportStatus as StaticAirportStatus,
  Airline,
  EKRoute,
  AirportMapData,
  FlightPath,
  TimelineEvent,
} from "./airport-data";
import type {
  AirportStatusResponse,
  FlightPositionResponse,
  AirportEventResponse,
  AirlineOpsResponse,
  EmiratesRouteResponse,
} from "./api-client";

const DESTINATION_COORDS: Record<string, [number, number]> = {
  ICN: [37.5, 127.0],
  LHR: [51.47, -0.46],
  NRT: [35.76, 140.39],
  JFK: [40.64, -73.78],
  CDG: [49.0, 2.55],
  BKK: [13.68, 100.75],
  SYD: [-33.95, 151.18],
  SIN: [1.35, 103.99],
  DME: [55.41, 37.91],
};

export const STATUS_LABELS: Record<string, string> = {
  green: "OPERATIONAL",
  amber: "DELAYS",
  red: "DISRUPTED",
};

export function toStaticStatus(data: AirportStatusResponse): StaticAirportStatus {
  return {
    light: data.light,
    label: STATUS_LABELS[data.light] ?? "UNKNOWN",
    runways: `${data.totalFlights} FLIGHTS · ${data.onTimePercent}% ON TIME`,
    weather: `${data.delayedFlights} DELAYED · ${data.cancelledFlights} CANCELLED`,
  };
}

function buildFlightPaths(flights: FlightPositionResponse[]): FlightPath[] {
  const seen = new Set<string>();
  const paths: FlightPath[] = [];

  for (const f of flights) {
    const callsign = f.callsign.trim();
    if (f.aircraftClass !== "ek" || !callsign) continue;

    for (const [code, dest] of Object.entries(DESTINATION_COORDS)) {
      if (!seen.has(code)) {
        seen.add(code);
        paths.push({ dest, color: "#f59e0b" });
      }
    }
    break; // only need one EK flight to trigger all destinations
  }

  return paths;
}

export function toMapData(flights: FlightPositionResponse[]): AirportMapData {
  const airborne = flights.filter((f) => !f.onGround);
  return {
    aircraft: airborne.map((f) => ({
      lat: f.lat,
      lng: f.lon,
      rotation: f.heading,
      flightLabel: f.callsign.trim() || f.icao24,
      altLabel: `FL${Math.round(f.altitude / 100)}`,
      cls: f.aircraftClass as "ek" | "other",
    })),
    flightPaths: buildFlightPaths(flights),
  };
}

export function toTimelineEvents(events: AirportEventResponse[], lang: string): TimelineEvent[] {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Filter out future events
  const filtered = events.filter((e) => new Date(e.eventDate) <= todayStart);

  const grouped = new Map<string, AirportEventResponse[]>();
  for (const e of filtered) {
    const date = new Date(e.eventDate);
    const key = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
    const arr = grouped.get(key) ?? [];
    arr.push(e);
    grouped.set(key, arr);
  }

  const todayKey = `${now.getUTCMonth() + 1}/${now.getUTCDate()}`;
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return Array.from(grouped.entries()).map(([dateKey, evts]) => {
    const isToday = dateKey === todayKey;
    const firstDate = new Date(evts[0].eventDate);
    const dotType = evts[0].eventType as TimelineEvent["dotType"];
    return {
      date: dateKey,
      dayLabel: isToday ? "TODAY" : dayNames[firstDate.getUTCDay()],
      isToday,
      dotType,
      entries: evts.map((e) => ({
        tags: [{ type: e.eventType as TimelineEvent["dotType"], label: e.eventType.toUpperCase() }],
        text: lang === "en" ? e.title.en : lang === "ja" ? (e.title.ja || e.title.en) : (e.title.ko || e.title.en),
      })),
    };
  });
}

export function toAirlines(ops: AirlineOpsResponse[]): Airline[] {
  return ops.map((o) => ({
    code: o.airlineIata,
    name: o.airlineName,
    flights: o.totalFlights,
    onTime: o.onTimePercent,
    status: o.status,
  }));
}

export function toRoutes(routes: EmiratesRouteResponse[]): EKRoute[] {
  return routes.map((r) => ({
    dest: r.destination,
    flightCode: r.flightCode,
    status: r.status,
  }));
}
