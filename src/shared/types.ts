export type Language = "en" | "ko" | "ja";

export type Severity = "critical" | "high" | "medium" | "low";

export type Region =
  | "east-asia"
  | "southeast-asia"
  | "south-asia"
  | "central-asia"
  | "middle-east"
  | "europe"
  | "north-america"
  | "south-america"
  | "africa"
  | "oceania";

export type NewsCategory =
  | "diplomacy"
  | "military"
  | "economy"
  | "human_rights"
  | "environment"
  | "tech";

export type MarketType =
  | "stock_index"
  | "commodity"
  | "forex"
  | "volatility"
  | "crypto";

export type VesselType =
  | "tanker_crude"
  | "tanker_product"
  | "lpg"
  | "lng";

export type MaritimeZone =
  | "hormuz"
  | "bab_el_mandeb"
  | "suez"
  | "persian_gulf"
  | "red_sea"
  | "gulf_of_aden";

export type VesselStatus =
  | "normal"
  | "rerouted"
  | "anchored"
  | "anomaly";

export type GeoEventType =
  | "conflict"
  | "protest"
  | "diplomacy"
  | "sanctions"
  | "military_exercise"
  | "trade_dispute"
  | "humanitarian_crisis"
  | "other";

export type AnalysisTargetType =
  | "article"
  | "geo_event"
  | "market"
  | "vessel"
  | "daily_briefing";

export type AnalysisType =
  | "summary"
  | "sentiment"
  | "briefing"
  | "cluster";

export type SentimentLabel =
  | "very_negative"
  | "negative"
  | "neutral"
  | "positive"
  | "very_positive";

export interface CollectionResult<T> {
  data: T;
  collectedAt: Date;
  source: string;
}

export interface TranslatedText {
  en: string;
  ko: string;
  ja: string;
}
