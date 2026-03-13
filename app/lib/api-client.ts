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
