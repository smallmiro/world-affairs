import type {
  OpenSkyCollectorPort,
  AviationStackCollectorPort,
  AirportEventCollectorPort,
  AirportRepositoryPort,
} from "../domain/airport/ports";
import type {
  FlightPosition,
  AirportStatus,
  AirportEvent,
  AirlineOps,
  EmiratesRoute,
} from "../domain/airport/entities";
import { randomUUID } from "crypto";

export interface CollectResult {
  total: number;
  saved: number;
  skipped: number;
}

// ─── Flights (time-series, no dedup) ──────────────────────────

export async function collectAirportFlights(
  collector: OpenSkyCollectorPort,
  repo: AirportRepositoryPort,
): Promise<CollectResult> {
  const result = await collector.collectFlights();
  const flights: FlightPosition[] = result.data.map((raw) => ({
    id: randomUUID(),
    ...raw,
    collectedAt: result.collectedAt,
  }));

  if (flights.length > 0) {
    await repo.saveFlights(flights);
  }

  return { total: flights.length, saved: flights.length, skipped: 0 };
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
