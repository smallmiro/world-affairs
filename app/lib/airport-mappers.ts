import type {
  AirportStatus as StaticAirportStatus,
  Airline,
  EKRoute,
  AirportMapData,
  TimelineEvent,
} from "./airport-data";
import type {
  AirportStatusResponse,
  FlightPositionResponse,
  AirportEventResponse,
  AirlineOpsResponse,
  EmiratesRouteResponse,
} from "./api-client";

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

export function toMapData(flights: FlightPositionResponse[]): AirportMapData {
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

export function toTimelineEvents(events: AirportEventResponse[], lang: string): TimelineEvent[] {
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
