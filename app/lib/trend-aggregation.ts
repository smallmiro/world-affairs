import type { GeoEvent } from "./types";

export interface TrendDataPoint {
  date: string;
  conflict: number;
  protest: number;
  diplomacy: number;
  other: number;
}

type TrendBucket = "conflict" | "protest" | "diplomacy" | "other";

function toBucket(eventType: GeoEvent["eventType"]): TrendBucket {
  switch (eventType) {
    case "conflict":
    case "military_exercise":
      return "conflict";
    case "protest":
      return "protest";
    case "diplomacy":
    case "sanctions":
      return "diplomacy";
    default:
      return "other";
  }
}

function formatDate(d: Date): string {
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function toDateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function aggregateTrend(events: GeoEvent[]): TrendDataPoint[] {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const days: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ key: toDateKey(d), label: formatDate(d) });
  }

  const counts = new Map<string, Record<TrendBucket, number>>();
  for (const day of days) {
    counts.set(day.key, { conflict: 0, protest: 0, diplomacy: 0, other: 0 });
  }

  for (const event of events) {
    const eventDate = new Date(event.eventDate);
    const key = toDateKey(eventDate);
    const row = counts.get(key);
    if (!row) continue;
    row[toBucket(event.eventType)]++;
  }

  return days.map((day) => {
    const row = counts.get(day.key)!;
    return {
      date: day.label,
      conflict: row.conflict,
      protest: row.protest,
      diplomacy: row.diplomacy,
      other: row.other,
    };
  });
}
