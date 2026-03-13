import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../src/infrastructure/prisma";
import { VesselRepository } from "../../../src/adapters/repositories/vessel-repository";
import type { MaritimeZone, VesselType } from "../../../src/shared/types";

const repo = new VesselRepository(prisma);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") as VesselType | null;
  const zone = searchParams.get("zone") as MaritimeZone | null;

  try {
    if (zone) {
      const vessels = await repo.findByZone(zone);
      return NextResponse.json({ data: vessels, count: vessels.length });
    }

    if (type) {
      const vessels = await repo.findByTypeWithPosition(type);
      return NextResponse.json({ data: vessels, count: vessels.length });
    }

    // Default: return all tanker types
    const tankerTypes: VesselType[] = [
      "tanker_crude",
      "tanker_product",
      "lpg",
      "lng",
    ];
    const results = [];
    for (const t of tankerTypes) {
      const vessels = await repo.findByTypeWithPosition(t);
      results.push(...vessels);
    }

    return NextResponse.json({ data: results, count: results.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch vessels", code: 500 },
      { status: 500 },
    );
  }
}
