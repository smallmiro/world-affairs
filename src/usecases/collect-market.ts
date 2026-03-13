import type { MarketCollectorPort, MarketRepositoryPort } from "../domain/market/ports";
import type { MarketSnapshot, RawMarketData } from "../domain/market/entities";
import { randomUUID } from "crypto";

function rawToSnapshot(raw: RawMarketData): MarketSnapshot {
  return {
    id: randomUUID(),
    symbol: raw.symbol,
    type: raw.type,
    name: raw.name,
    price: raw.price,
    change: raw.change,
    changePct: raw.changePct,
    open: raw.open,
    high: raw.high,
    low: raw.low,
    volume: raw.volume,
    currency: raw.currency,
    timestamp: new Date(),
  };
}

export interface CollectMarketResult {
  total: number;
  saved: number;
}

export async function collectMarket(
  collector: MarketCollectorPort,
  repository: MarketRepositoryPort,
): Promise<CollectMarketResult> {
  const result = await collector.collect();
  const snapshots = result.data.map(rawToSnapshot);

  if (snapshots.length > 0) {
    await repository.save(snapshots);
  }

  return {
    total: result.data.length,
    saved: snapshots.length,
  };
}
