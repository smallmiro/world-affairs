import type {
  GeoEventType,
  Severity,
  TranslatedText,
} from "../../shared/types";

export interface GeoEvent {
  id: string;
  source: string;
  eventType: GeoEventType;
  title: TranslatedText;
  description: TranslatedText | null;
  countries: string[];
  lat: number | null;
  lon: number | null;
  severity: Severity;
  goldsteinScale: number | null;
  eventDate: Date;
  collectedAt: Date;
}

export interface RawGeoEvent {
  source: string;
  eventType: GeoEventType | null;
  title: string;
  description: string | null;
  countries: string[];
  lat: number | null;
  lon: number | null;
  goldsteinScale: number | null;
  eventDate: Date;
  originalLanguage: string;
}
