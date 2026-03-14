import type { GeoEvent, Language, Region, Severity, TranslatedText } from "./types";
import { getTranslatedText } from "./display-mappers";

export interface RegionIssue {
  region: string;
  regionLabel: string;
  name: string;
  severity: Severity;
  severityLevel: number;
  trend: "up" | "stable" | "down";
  trendLabel: string;
  countries: string;
  eventCount: number;
  topEventDate: Date;
}

const SEVERITY_LEVEL: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
};

export const REGION_LABELS: Record<string, { en: string; ko: string }> = {
  "middle-east": { en: "MIDDLE EAST", ko: "중동" },
  "east-asia": { en: "EAST ASIA", ko: "동아시아" },
  "southeast-asia": { en: "SE ASIA", ko: "동남아" },
  "south-asia": { en: "SOUTH ASIA", ko: "남아시아" },
  "central-asia": { en: "CENTRAL ASIA", ko: "중앙아시아" },
  europe: { en: "EUROPE", ko: "유럽" },
  "north-america": { en: "N. AMERICA", ko: "북미" },
  "south-america": { en: "S. AMERICA", ko: "남미" },
  africa: { en: "AFRICA", ko: "아프리카" },
  oceania: { en: "OCEANIA", ko: "오세아니아" },
};

const REGION_MAP: [string[], string][] = [
  [["IR", "IQ", "SA", "YE", "SY", "IL", "PS", "LB", "JO", "AE", "QA", "BH", "KW", "OM"], "middle-east"],
  [["CN", "JP", "KR", "KP", "TW", "MN"], "east-asia"],
  [["PH", "VN", "TH", "MY", "ID", "SG", "MM", "KH", "LA"], "southeast-asia"],
  [["UA", "RU", "DE", "FR", "GB", "PL", "RO", "IT", "ES"], "europe"],
  [["US", "CA", "MX"], "north-america"],
  [["IN", "PK", "BD", "LK", "NP"], "south-asia"],
  [["BR", "AR", "CL", "CO", "VE", "PE"], "south-america"],
];

export function inferRegion(countries: string[]): string {
  const codes = countries.map((c) => c.toUpperCase());
  for (const [list, region] of REGION_MAP) {
    if (codes.some((c) => list.includes(c))) return region;
  }
  return "other";
}

export function aggregateByRegion(events: GeoEvent[], lang: Language): RegionIssue[] {
  const regionMap = new Map<string, GeoEvent[]>();

  for (const event of events) {
    const region = inferRegion(event.countries);
    if (!regionMap.has(region)) {
      regionMap.set(region, []);
    }
    regionMap.get(region)!.push(event);
  }

  const issues: RegionIssue[] = [];

  for (const [region, regionEvents] of regionMap) {
    if (region === "other") continue;

    const highestSeverity = regionEvents.reduce<Severity>((max, e) => {
      return SEVERITY_LEVEL[e.severity] > SEVERITY_LEVEL[max] ? e.severity : max;
    }, "low");

    const topEvent = regionEvents.reduce((top, e) =>
      SEVERITY_LEVEL[e.severity] > SEVERITY_LEVEL[top.severity] ? e : top,
    );

    const allCountries = [...new Set(regionEvents.flatMap((e) => e.countries))];
    const countryDisplay =
      allCountries.length <= 3
        ? allCountries.join(", ")
        : `${allCountries.slice(0, 2).join(", ")} +${allCountries.length - 2}`;

    const latestDate = regionEvents.reduce((latest, e) =>
      e.eventDate > latest ? e.eventDate : latest,
      regionEvents[0].eventDate,
    );

    issues.push({
      region,
      regionLabel: REGION_LABELS[region]?.en ?? region.toUpperCase(),
      name: getTranslatedText(topEvent.title, lang),
      severity: highestSeverity,
      severityLevel: SEVERITY_LEVEL[highestSeverity],
      trend: highestSeverity === "critical" ? "up" : "stable",
      trendLabel: highestSeverity === "critical" ? "급상승" : "유지",
      countries: countryDisplay,
      eventCount: regionEvents.length,
      topEventDate: latestDate,
    });
  }

  return issues.sort((a, b) => b.severityLevel - a.severityLevel);
}

export function goldsteinToSentiment(goldstein: number | null): { value: number; type: "negative" | "mixed" | "positive" } {
  if (goldstein === null) return { value: 50, type: "mixed" };
  const normalized = Math.round(((goldstein + 10) / 20) * 100);
  const clamped = Math.max(0, Math.min(100, normalized));
  const inverted = 100 - clamped;
  if (inverted >= 60) return { value: inverted, type: "negative" };
  if (inverted <= 30) return { value: inverted, type: "positive" };
  return { value: inverted, type: "mixed" };
}
