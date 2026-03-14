import type { MaritimeZone, NewsCategory, Region, VesselType } from "./types";
import { createHash } from "crypto";

export function hashString(str: string): string {
  return createHash("sha256").update(str).digest("hex").slice(0, 16);
}

const COUNTRY_TO_REGION: Record<string, Region> = {
  // East Asia
  CN: "east-asia", JP: "east-asia", KR: "east-asia", KP: "east-asia",
  TW: "east-asia", MN: "east-asia", HK: "east-asia",
  // Southeast Asia
  VN: "southeast-asia", TH: "southeast-asia", PH: "southeast-asia",
  ID: "southeast-asia", MY: "southeast-asia", SG: "southeast-asia",
  MM: "southeast-asia", KH: "southeast-asia", LA: "southeast-asia",
  // South Asia
  IN: "south-asia", PK: "south-asia", BD: "south-asia",
  LK: "south-asia", NP: "south-asia", AF: "south-asia",
  // Central Asia
  KZ: "central-asia", UZ: "central-asia", TM: "central-asia",
  KG: "central-asia", TJ: "central-asia",
  // Middle East
  IR: "middle-east", IQ: "middle-east", SA: "middle-east",
  AE: "middle-east", IL: "middle-east", PS: "middle-east",
  SY: "middle-east", YE: "middle-east", OM: "middle-east",
  QA: "middle-east", KW: "middle-east", BH: "middle-east",
  JO: "middle-east", LB: "middle-east", TR: "middle-east",
  // Europe
  GB: "europe", FR: "europe", DE: "europe", IT: "europe",
  ES: "europe", UA: "europe", RU: "europe", PL: "europe",
  RO: "europe", NL: "europe", SE: "europe", NO: "europe",
  FI: "europe", GR: "europe", PT: "europe", CZ: "europe",
  HU: "europe", AT: "europe", CH: "europe", BE: "europe",
  RS: "europe", HR: "europe", BG: "europe", SK: "europe",
  DK: "europe", IE: "europe", LT: "europe", LV: "europe",
  EE: "europe", BA: "europe", AL: "europe", MK: "europe",
  ME: "europe", XK: "europe", MD: "europe", BY: "europe",
  // North America
  US: "north-america", CA: "north-america", MX: "north-america",
  // South America
  BR: "south-america", AR: "south-america", CL: "south-america",
  CO: "south-america", PE: "south-america", VE: "south-america",
  EC: "south-america", BO: "south-america", PY: "south-america",
  UY: "south-america", GY: "south-america",
  // Africa
  EG: "africa", NG: "africa", ZA: "africa", KE: "africa",
  ET: "africa", GH: "africa", TZ: "africa", DZ: "africa",
  MA: "africa", TN: "africa", LY: "africa", SD: "africa",
  SS: "africa", SO: "africa", CD: "africa", CM: "africa",
  CI: "africa", SN: "africa", ML: "africa", NE: "africa",
  BF: "africa", TD: "africa", MZ: "africa", MG: "africa",
  AO: "africa", ZW: "africa", UG: "africa", RW: "africa",
  ER: "africa", DJ: "africa",
  // Oceania
  AU: "oceania", NZ: "oceania", FJ: "oceania", PG: "oceania",
};

export function countryToRegion(countryCode: string): Region | null {
  return COUNTRY_TO_REGION[countryCode.toUpperCase()] ?? null;
}

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  military: [
    "war", "military", "army", "navy", "missile", "nuclear", "weapon",
    "troops", "airforce", "drone", "attack", "combat", "defense",
    "nato", "conflict", "invasion", "artillery", "bomb", "strike",
    "soldier", "battalion", "ammunition", "warship", "fighter jet",
  ],
  diplomacy: [
    "diplomacy", "diplomat", "embassy", "summit", "treaty", "negotiate",
    "bilateral", "multilateral", "un security", "united nations",
    "foreign minister", "ambassador", "peace talk", "ceasefire",
    "resolution", "alliance", "accord", "pact",
  ],
  economy: [
    "trade", "tariff", "sanction", "economy", "gdp", "inflation",
    "export", "import", "commerce", "fiscal", "monetary", "currency",
    "debt", "investment", "trade war", "subsidy", "quota",
    "supply chain", "manufacturing", "recession",
  ],
  human_rights: [
    "human rights", "refugee", "asylum", "genocide", "humanitarian",
    "persecution", "minority", "freedom", "democracy", "protest",
    "civil rights", "detention", "censorship", "oppression",
  ],
  environment: [
    "climate", "environment", "emission", "carbon", "renewable",
    "pollution", "deforestation", "biodiversity", "cop2", "cop3",
    "paris agreement", "global warming", "sustainable",
  ],
  tech: [
    "technology", "cyber", "ai ", "artificial intelligence", "chip",
    "semiconductor", "5g", "quantum", "space", "satellite",
    "surveillance", "tech war", "huawei", "tsmc",
  ],
};

export function classifyCategory(text: string): NewsCategory | null {
  const lower = text.toLowerCase();
  let bestCategory: NewsCategory | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as NewsCategory;
    }
  }

  return bestCategory;
}

export function classifyRegionFromText(text: string): Region | null {
  const lower = text.toLowerCase();

  const regionKeywords: [Region, string[]][] = [
    ["middle-east", ["iran", "iraq", "syria", "yemen", "saudi", "israel", "palestine", "gaza", "houthi", "hormuz", "hezbollah", "lebanon"]],
    ["east-asia", ["china", "japan", "korea", "taiwan", "beijing", "tokyo", "pyongyang", "strait"]],
    ["southeast-asia", ["south china sea", "asean", "philippines", "vietnam", "myanmar", "indonesia", "thailand"]],
    ["europe", ["ukraine", "russia", "nato", "eu ", "european", "britain", "france", "germany", "balkans"]],
    ["south-asia", ["india", "pakistan", "afghanistan", "bangladesh", "kashmir"]],
    ["north-america", ["united states", "canada", "mexico", "washington", "pentagon"]],
    ["south-america", ["brazil", "argentina", "venezuela", "colombia", "peru"]],
    ["africa", ["africa", "sahel", "sudan", "ethiopia", "somalia", "congo", "nigeria"]],
    ["oceania", ["australia", "new zealand", "pacific island"]],
    ["central-asia", ["kazakhstan", "uzbekistan", "turkmenistan"]],
  ];

  for (const [region, keywords] of regionKeywords) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return region;
    }
  }

  return null;
}

// ─── Maritime Zone Classification ──────────────────────────────

const MARITIME_ZONES: { zone: MaritimeZone; bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number } }[] = [
  { zone: "hormuz", bounds: { minLat: 25.5, maxLat: 27.0, minLon: 55.5, maxLon: 57.0 } },
  { zone: "bab_el_mandeb", bounds: { minLat: 12.0, maxLat: 13.5, minLon: 43.0, maxLon: 44.0 } },
  { zone: "suez", bounds: { minLat: 29.5, maxLat: 31.5, minLon: 32.0, maxLon: 33.0 } },
  { zone: "persian_gulf", bounds: { minLat: 24.0, maxLat: 30.0, minLon: 48.0, maxLon: 56.5 } },
  { zone: "red_sea", bounds: { minLat: 13.5, maxLat: 29.5, minLon: 32.5, maxLon: 43.5 } },
  { zone: "gulf_of_aden", bounds: { minLat: 10.5, maxLat: 15.0, minLon: 43.0, maxLon: 51.0 } },
];

export function classifyZone(lat: number, lon: number): MaritimeZone | null {
  for (const { zone, bounds } of MARITIME_ZONES) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat && lon >= bounds.minLon && lon <= bounds.maxLon) {
      return zone;
    }
  }
  return null;
}

// ─── Vessel Type Classification ────────────────────────────────

const TANKER_CODES = new Set([80, 81, 82, 83, 84, 85, 86, 87, 88, 89]);

export function classifyShipType(aisType: number): VesselType | null {
  if (aisType === 0) return null; // unknown
  // Tankers (80-89)
  if (aisType === 82) return "lpg";
  if (aisType === 84) return "lng";
  if (aisType === 81) return "tanker_crude";
  if (TANKER_CODES.has(aisType)) return "tanker_product";
  // Cargo (70-79)
  if (aisType >= 70 && aisType <= 79) return "cargo";
  // Passenger (60-69)
  if (aisType >= 60 && aisType <= 69) return "passenger";
  // Other known types
  if (aisType >= 40 && aisType <= 49) return "other"; // high-speed craft
  if (aisType >= 50 && aisType <= 59) return "other"; // special craft
  if (aisType >= 90 && aisType <= 99) return "other"; // other
  if (aisType >= 1 && aisType <= 39) return "other";  // reserved/misc
  return "other";
}
