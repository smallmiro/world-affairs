import type { CollectionResult, MarketType } from "../../shared/types";
import type { MarketSnapshot, RawMarketData } from "./entities";

export interface MarketCollectorPort {
  collect(): Promise<CollectionResult<RawMarketData[]>>;
}

export interface MarketRepositoryPort {
  save(snapshots: MarketSnapshot[]): Promise<void>;
  findLatestByType(type: MarketType): Promise<MarketSnapshot[]>;
  findHistory(symbol: string, from: Date, to: Date): Promise<MarketSnapshot[]>;
}
