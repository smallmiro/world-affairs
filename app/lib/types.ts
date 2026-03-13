export type { Article } from "../../src/domain/news/entities";
export type { MarketSnapshot } from "../../src/domain/market/entities";
export type {
  Vessel,
  VesselPosition,
} from "../../src/domain/vessel/entities";
export type { GeoEvent } from "../../src/domain/geopolitics/entities";
export type { AiAnalysis } from "../../src/domain/analysis/entities";

export type {
  Language,
  Severity,
  Region,
  NewsCategory,
  MarketType,
  VesselType,
  MaritimeZone,
  VesselStatus,
  GeoEventType,
  SentimentLabel,
  TranslatedText,
} from "../../src/shared/types";

export interface ApiResponse<T> {
  data: T;
  count?: number;
}

export interface ApiError {
  error: string;
  code: number;
}

export interface VesselWithPosition extends Omit<import("../../src/domain/vessel/entities").Vessel, never> {
  latestPosition: import("../../src/domain/vessel/entities").VesselPosition | null;
}
