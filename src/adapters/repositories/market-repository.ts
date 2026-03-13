import type { MarketRepositoryPort } from "../../domain/market/ports";
import type { MarketSnapshot } from "../../domain/market/entities";
import type { MarketType } from "../../shared/types";
import type { PrismaClient } from "../../generated/prisma/client";

function toMarketSnapshot(row: Record<string, unknown>): MarketSnapshot {
  return {
    id: row.id as string,
    symbol: row.symbol as string,
    type: row.type as MarketType,
    name: row.name as string,
    price: row.price as number,
    change: row.change as number,
    changePct: row.changePct as number,
    open: (row.open as number) ?? null,
    high: (row.high as number) ?? null,
    low: (row.low as number) ?? null,
    volume: (row.volume as number) ?? null,
    currency: row.currency as string,
    timestamp: new Date(row.timestamp as string | Date),
  };
}

export class MarketRepository implements MarketRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  async save(snapshots: MarketSnapshot[]): Promise<void> {
    for (const snap of snapshots) {
      await this.prisma.marketSnapshot.upsert({
        where: {
          symbol_timestamp: {
            symbol: snap.symbol,
            timestamp: snap.timestamp,
          },
        },
        create: {
          symbol: snap.symbol,
          type: snap.type,
          name: snap.name,
          price: snap.price,
          change: snap.change,
          changePct: snap.changePct,
          open: snap.open,
          high: snap.high,
          low: snap.low,
          volume: snap.volume,
          currency: snap.currency,
          timestamp: snap.timestamp,
        },
        update: {
          price: snap.price,
          change: snap.change,
          changePct: snap.changePct,
          open: snap.open,
          high: snap.high,
          low: snap.low,
          volume: snap.volume,
        },
      });
    }
  }

  async findLatestByType(type: MarketType): Promise<MarketSnapshot[]> {
    const rows = await this.prisma.marketSnapshot.findMany({
      where: { type },
      orderBy: { timestamp: "desc" },
      distinct: ["symbol"],
    });
    return rows.map((r) => toMarketSnapshot(r as unknown as Record<string, unknown>));
  }

  async findHistory(symbol: string, from: Date, to: Date): Promise<MarketSnapshot[]> {
    const rows = await this.prisma.marketSnapshot.findMany({
      where: {
        symbol,
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: "asc" },
    });
    return rows.map((r) => toMarketSnapshot(r as unknown as Record<string, unknown>));
  }
}
