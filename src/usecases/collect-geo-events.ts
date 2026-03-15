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

// Keywords that indicate geopolitically relevant "other" events
const GEO_RELEVANT_KEYWORDS = [
  "oil", "energy", "crude", "brent", "opec", "lng", "gas",
  "shipping", "tanker", "vessel", "maritime", "port", "strait", "hormuz", "suez",
  "sanctions", "embargo", "tariff", "trade war",
  "nuclear", "uranium", "enrichment", "iaea",
  "nato", "alliance", "treaty", "summit",
  "refugee", "displacement", "humanitarian", "aid",
  "election", "coup", "regime", "government",
  "defense", "military", "weapon", "missile", "drone",
  "terrorism", "extremism", "insurgent",
  "cyber", "hack", "espionage",
  "iran", "israel", "gaza", "ukraine", "russia", "china", "taiwan", "korea",
  "houthi", "hezbollah", "hamas", "irgc",
  "stock", "market", "economy", "inflation", "currency",
  "airport", "airspace", "flight", "aviation",
];

function isGeoRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return GEO_RELEVANT_KEYWORDS.some((kw) => lower.includes(kw));
}

function titleFingerprint(title: string): string {
  return title.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).slice(0, 6).join(" ");
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
    const seenFingerprints = new Set<string>();

    for (const raw of result.data) {
      // Skip existing titles
      if (existingTitles.has(raw.title)) {
        skipped++;
        continue;
      }

      // Filter: skip 'other' type unless geopolitically relevant
      const eventType = raw.eventType ?? "other";
      if (eventType === "other" && !isGeoRelevant(raw.title)) {
        skipped++;
        continue;
      }

      // Dedup: skip if similar title already in this batch
      const fp = titleFingerprint(raw.title);
      if (seenFingerprints.has(fp)) {
        skipped++;
        continue;
      }
      seenFingerprints.add(fp);

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
