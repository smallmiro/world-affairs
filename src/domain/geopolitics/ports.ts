import type {
  CollectionResult,
  GeoEventType,
  Language,
  Severity,
} from "../../shared/types";
import type { GeoEvent, RawGeoEvent } from "./entities";

export interface GeoCollectorPort {
  collect(): Promise<CollectionResult<RawGeoEvent[]>>;
}

export interface GeoRepositoryPort {
  save(events: GeoEvent[]): Promise<void>;
  findLatest(limit: number, lang: Language): Promise<GeoEvent[]>;
  findBySeverity(severity: Severity, lang: Language, limit: number): Promise<GeoEvent[]>;
  findByEventType(eventType: GeoEventType, lang: Language, limit: number): Promise<GeoEvent[]>;
  filterExistingTitles(titles: string[]): Promise<Set<string>>;
}
