import type { NewsCategory, Region } from "./types";

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
