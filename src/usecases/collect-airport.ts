import type {
  OpenSkyCollectorPort,
  AviationStackCollectorPort,
  AirportEventCollectorPort,
  AirportRepositoryPort,
} from "../domain/airport/ports";
import type {
  FlightPosition,
  RawFlightPosition,
  AirportStatus,
  AirportEvent,
  AirlineOps,
  EmiratesRoute,
} from "../domain/airport/entities";
import type { PrismaClient } from "../generated/prisma/client";
import { randomUUID } from "crypto";

// ICAO→IATA mapping for callsign matching with DxbFlightStatus
const ICAO_TO_IATA_PREFIX: Record<string, string> = {
  UAE: "EK", FDB: "FZ", ETD: "EY", QTR: "QR", SVA: "SV",
  ABY: "G9", GFA: "GF", KAC: "KU", OMA: "WY",
  BAW: "BA", DLH: "LH", KAL: "KE", SIA: "SQ", THY: "TK",
};

function icaoToIataFlightCode(callsign: string): string | null {
  const trimmed = callsign.trim();
  if (!trimmed) return null;
  const prefix = trimmed.slice(0, 3).toUpperCase();
  const number = trimmed.slice(3).replace(/\s/g, "");
  const iataPrefix = ICAO_TO_IATA_PREFIX[prefix];
  if (!iataPrefix) return null;
  return `${iataPrefix} ${number}`;
}

export interface CollectResult {
  total: number;
  saved: number;
  skipped: number;
}

// ─── Flights (time-series, no dedup) ──────────────────────────

export async function collectAirportFlights(
  collector: OpenSkyCollectorPort,
  repo: AirportRepositoryPort,
  prisma?: PrismaClient,
): Promise<CollectResult> {
  const result = await collector.collectFlights();

  // Try to enrich with DxbFlightStatus data
  let dxbFlights: Map<string, { destination: string; scheduled: string; actual: string; status: string; direction: string }> | null = null;
  if (prisma) {
    try {
      const latest = await prisma.dxbFlightStatus.findFirst({ orderBy: { collectedAt: "desc" }, select: { collectedAt: true } });
      if (latest) {
        const statuses = await prisma.dxbFlightStatus.findMany({ where: { collectedAt: latest.collectedAt } });
        dxbFlights = new Map();
        for (const s of statuses) {
          dxbFlights.set(s.flightCode.replace(/\s/g, "").toUpperCase(), {
            destination: s.destination,
            scheduled: s.scheduled,
            actual: s.actual,
            status: s.status,
            direction: s.direction,
          });
        }
      }
    } catch { /* DxbFlightStatus table may not exist yet */ }
  }

  const flights: FlightPosition[] = result.data.map((raw) => {
    const enriched = enrichWithDxb(raw, dxbFlights);
    return {
      id: randomUUID(),
      ...enriched,
      collectedAt: result.collectedAt,
    };
  });

  if (flights.length > 0) {
    await repo.saveFlights(flights);
  }

  return { total: flights.length, saved: flights.length, skipped: 0 };
}

function enrichWithDxb(
  raw: RawFlightPosition,
  dxbFlights: Map<string, { destination: string; scheduled: string; actual: string; status: string; direction: string }> | null,
): RawFlightPosition {
  if (!dxbFlights) return raw;

  const iataCode = icaoToIataFlightCode(raw.callsign);
  if (!iataCode) return raw;

  const normalized = iataCode.replace(/\s/g, "").toUpperCase();
  const match = dxbFlights.get(normalized);
  if (!match) return raw;

  return {
    ...raw,
    depAirport: match.direction === "departure" ? "DXB" : match.destination.split(" ")[0],
    arrAirport: match.direction === "departure" ? match.destination.split(" ")[0] : "DXB",
    depTime: match.scheduled,
    arrTime: match.actual,
    flightStatus: match.status.toLowerCase().replace(/\s/g, "_"),
  };
}

// ─── Ops (status + airlines + routes) ─────────────────────────

export async function collectAirportOps(
  collector: AviationStackCollectorPort,
  repo: AirportRepositoryPort,
): Promise<CollectResult> {
  let saved = 0;

  const statusResult = await collector.collectStatus();
  const status: AirportStatus = {
    id: randomUUID(),
    ...statusResult.data,
    collectedAt: statusResult.collectedAt,
  };
  await repo.saveStatus(status);
  saved++;

  const opsResult = await collector.collectAirlineOps();
  const airlines: AirlineOps[] = opsResult.data.map((raw) => ({
    id: randomUUID(),
    ...raw,
    collectedAt: opsResult.collectedAt,
  }));
  if (airlines.length > 0) {
    await repo.saveAirlineOps(airlines);
    saved += airlines.length;
  }

  const routesResult = await collector.collectEmiratesRoutes();
  const routes: EmiratesRoute[] = routesResult.data.map((raw) => ({
    id: randomUUID(),
    ...raw,
    collectedAt: routesResult.collectedAt,
  }));
  if (routes.length > 0) {
    await repo.saveEmiratesRoutes(routes);
    saved += routes.length;
  }

  return { total: saved, saved, skipped: 0 };
}

// ─── Events (dedup by sourceId) ───────────────────────────────

export async function collectAirportEvents(
  collector: AirportEventCollectorPort,
  repo: AirportRepositoryPort,
): Promise<CollectResult> {
  const result = await collector.collectEvents();
  const total = result.data.length;

  const existingIds = await repo.filterExistingSourceIds(
    result.data.map((r) => ({ sourceId: r.sourceId, source: r.source })),
  );

  const newEvents: AirportEvent[] = [];
  for (const raw of result.data) {
    if (existingIds.has(raw.sourceId)) continue;

    newEvents.push({
      id: randomUUID(),
      sourceId: raw.sourceId,
      source: raw.source,
      url: raw.url,
      title: { en: raw.title, ko: "", ja: "" },
      description: raw.description
        ? { en: raw.description, ko: "", ja: "" }
        : null,
      eventType: raw.eventType,
      eventDate: raw.eventDate,
      collectedAt: result.collectedAt,
    });
  }

  if (newEvents.length > 0) {
    await repo.saveEvents(newEvents);
  }

  return { total, saved: newEvents.length, skipped: total - newEvents.length };
}
