import type { GeoCollectorPort } from "../../domain/geopolitics/ports";
import type { RawGeoEvent } from "../../domain/geopolitics/entities";
import type { CollectionResult, GeoEventType } from "../../shared/types";

const GDELT_GKG_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

const GDELT_EVENT_PARAMS = {
  query:
    "(conflict OR protest OR sanctions OR military exercise OR trade dispute OR humanitarian crisis OR coup OR ceasefire OR territorial) sourcelang:eng",
  mode: "artlist",
  format: "json",
  maxrecords: "50",
  sort: "datedesc",
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

const EVENT_TYPE_KEYWORDS: [GeoEventType, string[]][] = [
  ["conflict", ["conflict", "war", "attack", "combat", "fighting", "strike", "bomb", "shell", "assault"]],
  ["protest", ["protest", "demonstration", "riot", "unrest", "uprising", "rally"]],
  ["sanctions", ["sanction", "embargo", "blacklist", "ban", "restriction"]],
  ["military_exercise", ["military exercise", "drill", "naval exercise", "wargame", "deployment"]],
  ["trade_dispute", ["trade dispute", "tariff", "trade war", "commerce", "import ban"]],
  ["humanitarian_crisis", ["humanitarian", "refugee", "famine", "aid", "displacement", "crisis"]],
  ["diplomacy", ["diplomacy", "summit", "negotiation", "treaty", "agreement", "peace talk", "ceasefire"]],
];

function classifyEventType(text: string): GeoEventType | null {
  const lower = text.toLowerCase();
  for (const [eventType, keywords] of EVENT_TYPE_KEYWORDS) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return eventType;
    }
  }
  return null;
}

const COUNTRY_KEYWORDS: [string, string[]][] = [
  ["US", ["united states", "washington", "pentagon", "u.s."]],
  ["CN", ["china", "beijing"]],
  ["RU", ["russia", "moscow", "kremlin"]],
  ["UA", ["ukraine", "kyiv", "kiev"]],
  ["IR", ["iran", "tehran"]],
  ["IL", ["israel", "tel aviv", "jerusalem"]],
  ["PS", ["palestine", "gaza", "west bank"]],
  ["KP", ["north korea", "pyongyang"]],
  ["KR", ["south korea", "seoul"]],
  ["JP", ["japan", "tokyo"]],
  ["TW", ["taiwan", "taipei"]],
  ["SY", ["syria", "damascus"]],
  ["YE", ["yemen", "houthi"]],
  ["SA", ["saudi", "riyadh"]],
  ["IQ", ["iraq", "baghdad"]],
  ["AF", ["afghanistan", "kabul"]],
  ["MM", ["myanmar", "burma"]],
  ["SD", ["sudan", "khartoum"]],
  ["ET", ["ethiopia", "addis ababa"]],
  ["LB", ["lebanon", "beirut"]],
];

const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [38.9, -77.0], CN: [39.9, 116.4], RU: [55.8, 37.6], UA: [50.4, 30.5],
  IR: [35.7, 51.4], IL: [31.8, 35.2], PS: [31.5, 34.5], KP: [39.0, 125.8],
  KR: [37.6, 127.0], JP: [35.7, 139.7], TW: [25.0, 121.5], SY: [33.5, 36.3],
  YE: [15.4, 44.2], SA: [24.7, 46.7], IQ: [33.3, 44.4], AF: [34.5, 69.2],
  MM: [19.8, 96.2], SD: [15.6, 32.5], ET: [9.0, 38.7], LB: [33.9, 35.5],
};

function getCountryCoords(countries: string[]): { lat: number; lon: number } | null {
  for (const code of countries) {
    const coords = COUNTRY_COORDS[code];
    if (coords) return { lat: coords[0], lon: coords[1] };
  }
  return null;
}

function extractCountries(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [code, keywords] of COUNTRY_KEYWORDS) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        found.push(code);
        break;
      }
    }
  }
  return found;
}

export class GdeltGeoCollector implements GeoCollectorPort {
  async collect(): Promise<CollectionResult<RawGeoEvent[]>> {
    const params = new URLSearchParams(GDELT_EVENT_PARAMS);
    const url = `${GDELT_GKG_URL}?${params.toString()}`;

    const response = await fetch(url);
    if (response.status === 429) {
      console.warn("[GDELT Geo] Rate limited (429). Returning empty result.");
      return { data: [], collectedAt: new Date(), source: "gdelt-geo" };
    }
    if (!response.ok) {
      throw new Error(`GDELT Geo API error: ${response.status} ${response.statusText}`);
    }

    const data: GdeltResponse = await response.json();
    const articles = data.articles ?? [];

    const events: RawGeoEvent[] = articles.map((article) => {
      const text = `${article.title} ${article.domain}`;
      const countries = extractCountries(text);
      const coords = getCountryCoords(countries);
      return {
        source: "gdelt",
        eventType: classifyEventType(text),
        title: article.title,
        description: null,
        countries,
        lat: coords?.lat ?? null,
        lon: coords?.lon ?? null,
        goldsteinScale: null,
        eventDate: parseGdeltDate(article.seendate),
        originalLanguage: "en",
      };
    });

    return {
      data: events,
      collectedAt: new Date(),
      source: "gdelt-geo",
    };
  }
}

// Exported for testing
export { classifyEventType, extractCountries };
