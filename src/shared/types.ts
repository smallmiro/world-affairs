export type Language = "en" | "ko" | "ja";

export type Severity = "critical" | "high" | "medium" | "low";

export type Region =
  | "east-asia"
  | "middle-east"
  | "europe"
  | "north-america"
  | "south-america"
  | "africa"
  | "oceania"
  | "central-asia";

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

export type Strait =
  | "hormuz"
  | "bab_el_mandeb"
  | "suez";

export type VesselStatus =
  | "normal"
  | "rerouted"
  | "anchored"
  | "anomaly";

export type GeoEventType =
  | "conflict"
  | "protest"
  | "diplomacy"
  | "sanctions";

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
