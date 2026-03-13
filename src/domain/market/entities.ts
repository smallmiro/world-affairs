import type { MarketType } from "../../shared/types";

export interface MarketSnapshot {
  id: string;
  symbol: string;
  type: MarketType;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  currency: string;
  timestamp: Date;
}

export interface RawMarketData {
  symbol: string;
  type: MarketType;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  currency: string;
}
