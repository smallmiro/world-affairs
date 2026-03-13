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
  skipped: number;
}

export async function collectGeoEvents(
  collectors: GeoCollectorPort[],
  repository: GeoRepositoryPort,
): Promise<CollectGeoEventsResult> {
  let total = 0;
  let saved = 0;
  let skipped = 0;

  for (const collector of collectors) {
    const result = await collector.collect();
    total += result.data.length;

    // Deduplicate by title (GDELT articles have unique titles)
    const titles = result.data.map((r) => r.title);
    const existingTitles = await repository.filterExistingTitles(titles);

    const newEvents: GeoEvent[] = [];
    for (const raw of result.data) {
      if (existingTitles.has(raw.title)) {
        skipped++;
        continue;
      }
      newEvents.push(rawToGeoEvent(raw));
    }

    if (newEvents.length > 0) {
      await repository.save(newEvents);
      saved += newEvents.length;
    }
  }

  return { total, saved, skipped };
}

// Exported for testing
export { goldsteinToSeverity };
