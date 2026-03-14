import type { AirportEventCollectorPort } from "../../domain/airport/ports";
import type { RawAirportEvent } from "../../domain/airport/entities";
import type { CollectionResult, AirportEventType } from "../../shared/types";
import { hashString } from "../../shared/classify";

const GDELT_GKG_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

const GDELT_AIRPORT_PARAMS = {
  query:
    "(airport OR aviation OR airspace OR NOTAM OR DXB OR \"flight delay\" OR reroute OR airspace closure) AND (dubai OR UAE OR gulf OR hormuz OR iran OR \"middle east\") sourcelang:eng",
  mode: "artlist",
  format: "json",
  maxrecords: "50",
  sort: "datedesc",
  timespan: "7d",
};

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

function parseGdeltDate(seendate: string): Date {
  const year = seendate.slice(0, 4);
  const month = seendate.slice(4, 6);
  const day = seendate.slice(6, 8);
  const hour = seendate.slice(9, 11);
  const min = seendate.slice(11, 13);
  const sec = seendate.slice(13, 15);
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
}

const EVENT_TYPE_KEYWORDS: [AirportEventType, string[]][] = [
  [
    "conflict",
    [
      "strike",
      "missile",
      "military",
      "attack",
      "houthi",
      "drone",
      "bomb",
      "combat",
      "war",
    ],
  ],
  [
    "ops",
    [
      "notam",
      "reroute",
      "delay",
      "divert",
      "cancel",
      "runway",
      "closure",
      "suspend",
    ],
  ],
  [
    "info",
    [
      "warning",
      "advisory",
      "defense",
      "airspace",
      "exercise",
      "surveillance",
    ],
  ],
  [
    "normal",
    ["resume", "restore", "reopen", "clear", "normal", "operational"],
  ],
];

export function classifyAirportEventType(text: string): AirportEventType {
  const lower = text.toLowerCase();
  for (const [eventType, keywords] of EVENT_TYPE_KEYWORDS) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return eventType;
    }
  }
  return "info";
}

export class GdeltAirportEventCollector implements AirportEventCollectorPort {
  async collectEvents(): Promise<CollectionResult<RawAirportEvent[]>> {
    const params = new URLSearchParams(GDELT_AIRPORT_PARAMS);
    const url = `${GDELT_GKG_URL}?${params.toString()}`;

    const response = await fetch(url);
    if (response.status === 429) {
      console.warn("[GDELT Airport] Rate limited (429). Returning empty result.");
      return { data: [], collectedAt: new Date(), source: "gdelt-airport" };
    }
    if (!response.ok) {
      throw new Error(
        `GDELT Airport API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: GdeltResponse = await response.json();
    const articles = data.articles ?? [];

    const events: RawAirportEvent[] = articles.map((article) => ({
      sourceId: hashString(article.url),
      source: "gdelt",
      url: article.url,
      title: article.title,
      description: null,
      eventType: classifyAirportEventType(article.title),
      eventDate: parseGdeltDate(article.seendate),
    }));

    return {
      data: events,
      collectedAt: new Date(),
      source: "gdelt-airport",
    };
  }
}
