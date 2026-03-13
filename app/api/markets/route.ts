import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../src/infrastructure/prisma";
import { MarketRepository } from "../../../src/adapters/repositories/market-repository";
import type { MarketType } from "../../../src/shared/types";

const repo = new MarketRepository(prisma);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") as MarketType | null;

  try {
    if (type) {
      const snapshots = await repo.findLatestByType(type);
      return NextResponse.json({ data: snapshots, count: snapshots.length });
    }

    // Return all latest snapshots grouped by type
    const types: MarketType[] = [
      "stock_index",
      "commodity",
      "forex",
      "volatility",
      "crypto",
    ];
    const results: Record<string, unknown[]> = {};
    for (const t of types) {
      results[t] = await repo.findLatestByType(t);
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch markets", code: 500 },
      { status: 500 },
    );
  }
}
