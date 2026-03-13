import type { GeoCollectorPort, GeoRepositoryPort } from "../domain/geopolitics/ports";
import type { GeoEvent, RawGeoEvent } from "../domain/geopolitics/entities";
import type { GeoEventType, Severity } from "../shared/types";
import { randomUUID } from "crypto";

function goldsteinToSeverity(scale: number | null): Severity {
  if (scale === null) return "medium";
  const abs = Math.abs(scale);
  if (abs >= 8) return "critical";
  if (abs >= 5) return "high";
  if (abs >= 2) return "medium";
  return "low";
}

function rawToGeoEvent(raw: RawGeoEvent): GeoEvent {
  return {
    id: randomUUID(),
    source: raw.source,
    eventType: raw.eventType ?? "other",
    title: {
      en: raw.title,
      ko: "",
      ja: "",
    },
    description: raw.description
      ? { en: raw.description, ko: "", ja: "" }
      : null,
    countries: raw.countries,
    lat: raw.lat,
    lon: raw.lon,
    severity: goldsteinToSeverity(raw.goldsteinScale),
    goldsteinScale: raw.goldsteinScale,
    eventDate: raw.eventDate,
    collectedAt: new Date(),
  };
}

export interface CollectGeoEventsResult {
  total: number;
  saved: number;
}

export async function collectGeoEvents(
  collectors: GeoCollectorPort[],
  repository: GeoRepositoryPort,
): Promise<CollectGeoEventsResult> {
  let total = 0;
  let saved = 0;

  for (const collector of collectors) {
    const result = await collector.collect();
    total += result.data.length;

    const events = result.data.map(rawToGeoEvent);

    if (events.length > 0) {
      await repository.save(events);
      saved += events.length;
    }
  }

  return { total, saved };
}

// Exported for testing
export { goldsteinToSeverity };
