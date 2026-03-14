import type {
  Article,
  MarketSnapshot,
  GeoEvent,
  AiAnalysis,
  VesselWithPosition,
  ApiResponse,
  Language,
  NewsCategory,
  Region,
  Severity,
  GeoEventType,
  MarketType,
  MaritimeZone,
  VesselType,
} from "./types";

async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
  }
  const query = qs.toString();
  const url = query ? `${path}?${query}` : path;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export interface NewsParams {
  lang?: Language;
  limit?: number;
  region?: Region;
  category?: NewsCategory;
}

export async function fetchNews(params?: NewsParams): Promise<Article[]> {
  const p: Record<string, string> = {};
  if (params?.lang) p.lang = params.lang;
  if (params?.limit) p.limit = String(params.limit);
  if (params?.region) p.region = params.region;
  if (params?.category) p.category = params.category;
  const res = await fetchApi<ApiResponse<Article[]>>("/api/news", p);
  return res.data;
}

export interface MarketsAllResponse {
  stock_index: MarketSnapshot[];
  commodity: MarketSnapshot[];
  forex: MarketSnapshot[];
  volatility: MarketSnapshot[];
  crypto: MarketSnapshot[];
}

export async function fetchMarkets(type?: MarketType): Promise<MarketSnapshot[] | MarketsAllResponse> {
  if (type) {
    const res = await fetchApi<ApiResponse<MarketSnapshot[]>>("/api/markets", { type });
    return res.data;
  }
  const res = await fetchApi<ApiResponse<MarketsAllResponse>>("/api/markets");
  return res.data;
}

export async function fetchMarketsByType(type: MarketType): Promise<MarketSnapshot[]> {
  const res = await fetchApi<ApiResponse<MarketSnapshot[]>>("/api/markets", { type });
  return res.data;
}

export async function fetchAllMarkets(): Promise<MarketsAllResponse> {
  const res = await fetchApi<ApiResponse<MarketsAllResponse>>("/api/markets");
  return res.data;
}

export interface VesselParams {
  type?: VesselType;
  zone?: MaritimeZone;
}

export async function fetchVessels(params?: VesselParams): Promise<VesselWithPosition[]> {
  const p: Record<string, string> = {};
  if (params?.type) p.type = params.type;
  if (params?.zone) p.zone = params.zone;
  const res = await fetchApi<ApiResponse<VesselWithPosition[]>>("/api/vessels", p);
  return res.data;
}

export interface GeoEventParams {
  lang?: Language;
  limit?: number;
  severity?: Severity;
  eventType?: GeoEventType;
}

export async function fetchGeoEvents(params?: GeoEventParams): Promise<GeoEvent[]> {
  const p: Record<string, string> = {};
  if (params?.lang) p.lang = params.lang;
  if (params?.limit) p.limit = String(params.limit);
  if (params?.severity) p.severity = params.severity;
  if (params?.eventType) p.eventType = params.eventType;
  const res = await fetchApi<ApiResponse<GeoEvent[]>>("/api/geo-events", p);
  return res.data;
}

// ─── Airport ──────────────────────────────────────────────────

export interface AirportStatusResponse {
  id: string;
  light: "green" | "amber" | "red";
  totalFlights: number;
  onTimePercent: number;
  delayedFlights: number;
  cancelledFlights: number;
  collectedAt: string;
}

export interface FlightPositionResponse {
  id: string;
  icao24: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  speed: number;
  heading: number;
  onGround: boolean;
  airlineIata: string | null;
  aircraftClass: "ek" | "other";
  collectedAt: string;
}

export interface AirportEventResponse {
  id: string;
  sourceId: string;
  source: string;
  url: string;
  title: { en: string; ko: string; ja: string };
  description: { en: string; ko: string; ja: string } | null;
  eventType: "conflict" | "ops" | "info" | "normal";
  eventDate: string;
  collectedAt: string;
}

export interface AirlineOpsResponse {
  id: string;
  airlineIata: string;
  airlineName: string;
  totalFlights: number;
  onTimePercent: number;
  status: "normal" | "delays" | "disrupted";
  collectedAt: string;
}

export interface EmiratesRouteResponse {
  id: string;
  destination: string;
  flightCode: string;
  status: "open" | "diverted" | "suspended";
  collectedAt: string;
}

export async function fetchAirportStatus(): Promise<AirportStatusResponse | null> {
  const res = await fetchApi<ApiResponse<AirportStatusResponse | null>>("/api/airport", { section: "status" });
  return res.data;
}

export async function fetchFlightPositions(limit?: number): Promise<FlightPositionResponse[]> {
  const p: Record<string, string> = { section: "flights" };
  if (limit) p.limit = String(limit);
  const res = await fetchApi<ApiResponse<FlightPositionResponse[]>>("/api/airport", p);
  return res.data;
}

export async function fetchAirportEvents(limit?: number): Promise<AirportEventResponse[]> {
  const p: Record<string, string> = { section: "events" };
  if (limit) p.limit = String(limit);
  const res = await fetchApi<ApiResponse<AirportEventResponse[]>>("/api/airport", p);
  return res.data;
}

export async function fetchAirlineOps(): Promise<AirlineOpsResponse[]> {
  const res = await fetchApi<ApiResponse<AirlineOpsResponse[]>>("/api/airport", { section: "airlines" });
  return res.data;
}

export async function fetchEmiratesRoutes(): Promise<EmiratesRouteResponse[]> {
  const res = await fetchApi<ApiResponse<EmiratesRouteResponse[]>>("/api/airport", { section: "routes" });
  return res.data;
}

export async function fetchBriefing(lang?: Language): Promise<AiAnalysis | null> {
  const p: Record<string, string> = {};
  if (lang) p.lang = lang;
  try {
    const res = await fetchApi<ApiResponse<AiAnalysis>>("/api/analysis/briefing", p);
    return res.data;
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      return null;
    }
    throw err;
  }
}
