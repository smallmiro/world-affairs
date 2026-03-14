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
import { randomUUID } from "crypto";

const OPENSKY_TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const DXB_ICAO = "OMDB";

async function fetchDxbRoutes(): Promise<Map<string, { dep: string | null; arr: string | null }>> {
  const clientId = process.env.OPENSKY_USERNAME;
  const clientSecret = process.env.OPENSKY_PASSWORD;
  if (!clientId || !clientSecret) return new Map();

  // Get OAuth2 token
  const tokenRes = await fetch(OPENSKY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }).toString(),
  });
  if (!tokenRes.ok) return new Map();
  const { access_token } = await tokenRes.json() as { access_token: string };

  const now = Math.floor(Date.now() / 1000);
  const begin = now - 43200; // 12 hours

  const [arrRes, depRes] = await Promise.all([
    fetch(`https://opensky-network.org/api/flights/arrival?airport=${DXB_ICAO}&begin=${begin}&end=${now}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    }),
    fetch(`https://opensky-network.org/api/flights/departure?airport=${DXB_ICAO}&begin=${begin}&end=${now}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    }),
  ]);

  const map = new Map<string, { dep: string | null; arr: string | null }>();

  if (arrRes.ok) {
    const arrivals = await arrRes.json() as { icao24: string; estDepartureAirport: string | null; estArrivalAirport: string | null }[];
    for (const f of arrivals) {
      map.set(f.icao24, { dep: f.estDepartureAirport, arr: f.estArrivalAirport });
    }
  }
  if (depRes.ok) {
    const departures = await depRes.json() as { icao24: string; estDepartureAirport: string | null; estArrivalAirport: string | null }[];
    for (const f of departures) {
      if (!map.has(f.icao24)) {
        map.set(f.icao24, { dep: f.estDepartureAirport, arr: f.estArrivalAirport });
      }
    }
  }

  return map;
}

export interface CollectResult {
  total: number;
  saved: number;
  skipped: number;
}

// ─── Flights (upsert by icao24) ───────────────────────────────

export async function collectAirportFlights(
  collector: OpenSkyCollectorPort,
  repo: AirportRepositoryPort,
): Promise<CollectResult> {
  const result = await collector.collectFlights();

  // Enrich with OpenSky flights API (arrivals/departures by airport)
  let routeMap: Map<string, { dep: string | null; arr: string | null }> | null = null;
  try {
    routeMap = await fetchDxbRoutes();
  } catch { /* OpenSky flights API may fail */ }

  const flights: FlightPosition[] = result.data.map((raw) => {
    const route = routeMap?.get(raw.icao24);
    const enriched = route ? {
      ...raw,
      depAirport: route.dep,
      arrAirport: route.arr,
    } : raw;
    return {
      id: randomUUID(),
      ...enriched,
      collectedAt: result.collectedAt,
    };
  });

  // Separate airborne vs ground
  const airborne = flights.filter((f) => !f.onGround);
  const grounded = flights.filter((f) => f.onGround);

  if (airborne.length > 0) {
    await repo.saveFlights(airborne);
  }

  // Delete grounded aircraft from DB
  if (grounded.length > 0) {
    await repo.deleteFlightsByIcao24(grounded.map((f) => f.icao24));
  }

  // Delete aircraft no longer in API response (left bbox or disappeared)
  await repo.deleteStaleFlights(airborne.map((f) => f.icao24));

  return { total: flights.length, saved: airborne.length, skipped: grounded.length };
}

// ─── Refresh existing aircraft states ─────────────────────────

export async function refreshAircraftStates(
  collector: OpenSkyCollectorPort,
  repo: AirportRepositoryPort,
): Promise<{ updated: number; deleted: number }> {
  // Get all icao24s currently in DB
  const existing = await repo.findLatestFlights(1000);
  const icao24s = existing.map((f) => f.icao24);
  if (icao24s.length === 0) return { updated: 0, deleted: 0 };

  // Query OpenSky for their current state
  const result = await collector.refreshByIcao24(icao24s);
  const activeSet = new Set(result.data.map((f) => f.icao24));

  // Upsert airborne, delete grounded
  const airborne = result.data.filter((f) => !f.onGround);
  const grounded = result.data.filter((f) => f.onGround);

  if (airborne.length > 0) {
    await repo.saveFlights(airborne.map((raw) => ({
      id: randomUUID(),
      ...raw,
      collectedAt: result.collectedAt,
    })));
  }

  // Delete grounded
  let deleted = 0;
  if (grounded.length > 0) {
    deleted += await repo.deleteFlightsByIcao24(grounded.map((f) => f.icao24));
  }

  // Delete aircraft no longer returned by API (no longer transmitting)
  const disappeared = icao24s.filter((id) => !activeSet.has(id));
  if (disappeared.length > 0) {
    deleted += await repo.deleteFlightsByIcao24(disappeared);
  }

  return { updated: airborne.length, deleted };
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
